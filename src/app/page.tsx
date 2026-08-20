import { Suspense } from "react";
import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { lessonProgress, quizAttempts } from "@/db/schema";
import { LESSONS, TRACKS, orderedLessons } from "@/data/course";
import { questionById } from "@/data/questions";
import { getLearner } from "@/lib/learner";
import {
  buildReminder,
  formatElapsed,
  getLastActivity,
  getPracticeStats,
  getWeakTracks,
  REMINDER_COLOR,
} from "@/lib/insights";
import Onboarding from "@/components/Onboarding";
import ProgressRing from "@/components/ProgressRing";
import { TOPIC_COLOR } from "@/data/practice";

export default async function DashboardPage() {
  const learner = await getLearner().catch(() => null);

  if (!learner) {
    return (
      <div className="mx-auto max-w-3xl">
        <Onboarding />
        <div className="mt-8">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-dim">
            커리큘럼 미리보기
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {TRACKS.map((t) => (
              <div key={t.id} className="rounded-lg border border-line bg-panel p-4">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
                    {t.code}
                  </span>
                </div>
                <div className="mt-1.5 font-display text-sm font-semibold">{t.name}</div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-mute">
                  {t.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

let progressRows, agg, recentAttempts;
  let weakTracks: Awaited<ReturnType<typeof getWeakTracks>> = [];
  let lastActivity: Date | null = null;
  let practiceStats: Awaited<ReturnType<typeof getPracticeStats>> | null = null;
  let hasError = false;
  let errorMessage: string | null = null;

  try {
    progressRows = await db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.learnerId, learner.id), eq(lessonProgress.completed, true)));
    agg = await db
      .select({
        total: sql<number>`(count(*))::int`,
        correct: sql<number>`(count(*) filter (where ${quizAttempts.isCorrect}))::int`,
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.learnerId, learner.id));
    recentAttempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.learnerId, learner.id))
      .orderBy(desc(quizAttempts.id))
      .limit(6);
    [weakTracks, lastActivity, practiceStats] = await Promise.all([
      getWeakTracks(learner.id),
      getLastActivity(learner.id),
      getPracticeStats(learner.id),
    ]);
  } catch (e) {
    hasError = true;
    errorMessage = e instanceof Error ? e.message : "학습 데이터를 불러오는 중 오류가 발생했습니다.";
  }

  if (hasError) {
    return (
      <div className="mx-auto max-w-3xl">
        <ProgressRing percent={0} size={72} stroke={7} sub="오류" color="var(--color-alarm)" />
        <div className="mt-6 text-center">
          <p className="font-semibold text-alarm mb-4">데이터 로딩 오류</p>
          <p className="text-mute">{errorMessage}</p>
          <div className="mt-6">
            <Link href="/" className="rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-canvas transition-all hover:brightness-110">
              대시보드로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const completedIds = new Set(progressRows!.map((p) => p.lessonId));
  const completedCount = completedIds.size;
  const totalCount = LESSONS.length;
  const completionPct = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  const total = agg![0]?.total ?? 0;
  const correct = agg![0]?.correct ?? 0;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);

  const practicePct =
    !practiceStats || practiceStats.total === 0
      ? 0
      : (practiceStats.completed / practiceStats.total) * 100;

  const upcoming = orderedLessons().filter((l) => !completedIds.has(l.id)).slice(0, 3);

  const reminder = buildReminder(lastActivity);
  const reminderColor = REMINDER_COLOR[reminder.tone];

  return (
    <Suspense fallback={<ProgressRing percent={0} size={72} stroke={7} sub="강의" />}>
      <div className="mx-auto max-w-5xl">
      {/* 헤더 */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-signal">
            Learning Dashboard
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {learner.name}의 학습 현황
          </h1>
          {learner.goal ? (
            <p className="mt-1 text-sm text-mute">
              목표: <span className="text-ink">{learner.goal}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/playground"
            className="rounded-lg border border-line bg-panel px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-signal/60 hover:text-signal"
          >
            코딩 연습장
          </Link>
          <Link
            href="/learn"
            className="rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-canvas transition-all hover:brightness-110 active:scale-[0.98]"
          >
            이어서 학습하기 →
          </Link>
        </div>
      </div>

      {/* 학습 리마인더 */}
      <div
        className="mt-6 flex items-center gap-3 rounded-xl border p-4"
        style={{
          borderColor: `${reminderColor}55`,
          backgroundColor: `${reminderColor}12`,
        }}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
          style={{ backgroundColor: `${reminderColor}22`, color: reminderColor }}
        >
          {reminder.tone === "good" ? "✓" : reminder.tone === "warn" ? "⏰" : "⚠"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" style={{ color: reminderColor }}>
            {reminder.message}
          </p>
          {lastActivity ? (
            <p className="mt-0.5 text-xs text-mute">
              마지막 학습: {formatElapsed(lastActivity)}
            </p>
          ) : null}
        </div>
        <Link
          href="/learn"
          className="shrink-0 rounded-lg bg-signal px-3 py-1.5 text-xs font-semibold text-canvas transition-all hover:brightness-110 active:scale-[0.98]"
        >
          학습하기
        </Link>
      </div>

      {/* 통계 */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-line bg-panel p-4">
          <ProgressRing percent={completionPct} size={72} stroke={7} sub="강의" />
          <div>
            <div className="font-display text-xl font-bold">
              {completedCount}
              <span className="text-sm font-medium text-dim"> / {totalCount}</span>
            </div>
            <div className="text-xs text-mute">완료한 강의</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-line bg-panel p-4">
          <ProgressRing
            percent={accuracy}
            size={72}
            stroke={7}
            color={accuracy >= 70 ? "var(--color-pine)" : "var(--color-alarm)"}
            sub="퀴즈"
          />
          <div>
            <div className="font-display text-xl font-bold">{accuracy}%</div>
            <div className="text-xs text-mute">퀴즈 정답률</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-line bg-panel p-4">
          <ProgressRing
            percent={practicePct}
            size={72}
            stroke={7}
            color="var(--color-signal)"
            sub="실습"
          />
          <div>
            <div className="font-display text-xl font-bold">
              {practiceStats?.completed ?? 0}
              <span className="text-sm font-medium text-dim">
                {" "}
                / {practiceStats?.total ?? 0}
              </span>
            </div>
            <div className="text-xs text-mute">실습 완료</div>
            {practiceStats && (
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(practiceStats.byTopic)
                  .filter(([_, count]) => count > 0)
                  .slice(0, 3)
                  .map(([topic, count]) => (
                    <span
                      key={topic}
                      className="rounded px-1 py-0.5 font-mono text-[9px] font-bold text-canvas"
                      style={{ backgroundColor: TOPIC_COLOR[topic as keyof typeof TOPIC_COLOR] }}
                    >
                      {topic}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-panel p-4">
          <div className="font-display text-2xl font-bold">{total}</div>
          <div className="mt-1 text-xs text-mute">누적 풀이 수</div>
          <div className="mt-3 text-[11px] text-dim">
            정답 {correct} · 오답 {total - correct}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-panel p-4">
          <div className="font-display text-2xl font-bold">
            {TRACKS.filter((t) => {
              const lessons = LESSONS.filter((l) => l.trackId === t.id);
              return lessons.length > 0 && lessons.every((l) => completedIds.has(l.id));
            }).length}
            <span className="text-sm font-medium text-dim"> / {TRACKS.length}</span>
          </div>
          <div className="mt-1 text-xs text-mute">완주한 트랙</div>
          <div className="mt-3 flex gap-1">
            {TRACKS.map((t) => {
              const lessons = LESSONS.filter((l) => l.trackId === t.id);
              const done = lessons.every((l) => completedIds.has(l.id));
              return (
                <span
                  key={t.id}
                  className="h-1.5 flex-1 rounded-full"
                  style={{
                    backgroundColor: done ? t.color : "var(--color-line)",
                  }}
                  title={t.name}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 취약 주제 추천 */}
      {weakTracks.length > 0 ? (
        <div className="mt-8">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-dim">
            보강이 필요한 주제
          </h2>
          <p className="mt-1 text-xs text-mute">
            정답률이 70% 미만인 트랙입니다. 관련 강의를 복습해 보세요.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {weakTracks.map((w) => (
              <div
                key={w.trackId}
                className="rounded-xl border border-line bg-panel p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: w.color }}
                    />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
                      {w.trackCode}
                    </span>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 font-mono text-[11px] font-bold"
                    style={{
                      backgroundColor: `${w.color}22`,
                      color: w.color,
                    }}
                  >
                    {w.accuracy}%
                  </span>
                </div>
                <div className="mt-1.5 font-display text-sm font-semibold">
                  {w.trackName}
                </div>
                <p className="mt-1 text-[11px] text-dim">
                  {w.attempts}문제 중 {w.correct}문제 정답
                </p>
                {w.recommendedLessons.length > 0 ? (
                  <div className="mt-3 space-y-1.5 border-t border-line/60 pt-3">
                    {w.recommendedLessons.map((l) => (
                      <Link
                        key={l.id}
                        href={`/learn/${l.id}`}
                        className="group flex items-center justify-between gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-raise"
                      >
                        <span className="truncate text-xs font-medium text-ink group-hover:text-signal">
                          {l.title}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-dim">
                          {l.minutes}분
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 border-t border-line/60 pt-3 text-[11px] text-pine">
                    모든 강의를 완료했습니다. 퀴즈로 복습하세요!
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* 이어 배우기 */}
        <section className="lg:col-span-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-dim">
            이어 배울 강의
          </h2>
          <div className="mt-3 space-y-2.5">
            {upcoming.length === 0 ? (
              <div className="rounded-lg border border-pine/40 bg-pine/8 p-5 text-sm text-pine">
                모든 강의를 완주했습니다. 퀴즈 복습과 프로젝트 로드맵으로
                넘어가세요!
              </div>
            ) : (
              upcoming.map((l) => {
                const track = TRACKS.find((t) => t.id === l.trackId);
                return (
                  <Link
                    key={l.id}
                    href={`/learn/${l.id}`}
                    className="group flex items-center gap-4 rounded-lg border border-line bg-panel p-4 transition-colors hover:border-edge"
                  >
                    <span
                      className="h-8 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: track?.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
                          {track?.code}
                        </span>
                        <span className="rounded border border-line px-1.5 py-px text-[10px] text-mute">
                          {l.level}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-sm font-semibold group-hover:text-signal">
                        {l.title}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-mute">{l.summary}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-dim">
                      {l.minutes}분
                    </span>
                  </Link>
                );
              })
            )}
          </div>

          {/* 트랙별 진행률 */}
          <h2 className="mt-7 font-display text-sm font-semibold uppercase tracking-widest text-dim">
            트랙별 진행률
          </h2>
          <div className="mt-3 space-y-2 rounded-lg border border-line bg-panel p-4">
            {TRACKS.map((t) => {
              const lessons = LESSONS.filter((l) => l.trackId === t.id);
              const done = lessons.filter((l) => completedIds.has(l.id)).length;
              const pct = lessons.length === 0 ? 0 : (done / lessons.length) * 100;
              return (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-xs text-mute">{t.name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: t.color }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-[11px] text-dim">
                    {done}/{lessons.length}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 최근 퀴즈 기록 */}
        <section className="lg:col-span-2">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-dim">
            최근 퀴즈 기록
          </h2>
          <div className="mt-3 rounded-lg border border-line bg-panel">
            {recentAttempts!.length === 0 ? (
              <div className="p-5 text-sm text-mute">
                아직 푼 문제가 없습니다.{" "}
                <Link href="/quiz" className="text-signal underline-offset-2 hover:underline">
                  실전 퀴즈
                </Link>
                에서 첫 문제를 풀어 보세요.
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {recentAttempts!.map((a) => {
                  const q = questionById(a.questionId);
                  return (
                    <li key={a.id} className="flex items-start gap-3 p-3.5">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          a.isCorrect ? "bg-pine/15 text-pine" : "bg-alarm/15 text-alarm"
                        }`}
                      >
                        {a.isCorrect ? "✓" : "✗"}
                      </span>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-xs leading-relaxed text-mute">
                          {q?.prompt ?? a.questionId}
                        </p>
                        <span className="mt-1 block font-mono text-[10px] text-dim">
                          {new Date(a.createdAt).toLocaleString("ko-KR", {
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-4 rounded-lg border border-line bg-panel p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-signal">
              Today&apos;s Tip
            </div>
            <p className="mt-2 text-xs leading-relaxed text-mute">
              독일 면접관은 &ldquo;volatile을 쓰면 스레드 안전한가?&rdquo; 같은
              후속 질문을 좋아합니다. 퀴즈 해설을 <em>말로</em> 설명해 보는
              연습을 하세요.
            </p>
          </div>
        </section>
      </div>
    </div>
    </Suspense>
  );
}
