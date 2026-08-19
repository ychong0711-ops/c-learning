import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { quizAttempts } from "@/db/schema";
import { TRACKS } from "@/data/course";
import { questionsByTrack, QUESTIONS } from "@/data/questions";
import { getLearnerId } from "@/lib/learner";

export const metadata = { title: "실전 퀴즈 — EMBED:C LAB" };

export default async function QuizHubPage() {
  const learnerId = await getLearnerId().catch(() => null);

  const perQuestionIds = new Map(QUESTIONS.map((q) => [q.id, q.trackId]));

  const rows = learnerId
    ? await db
        .select({
          questionId: quizAttempts.questionId,
          total: sql<number>`(count(*))::int`,
          correct: sql<number>`(count(*) filter (where ${quizAttempts.isCorrect}))::int`,
        })
        .from(quizAttempts)
        .where(eq(quizAttempts.learnerId, learnerId))
        .groupBy(quizAttempts.questionId)
    : [];

  const trackStats = TRACKS.map((t) => {
    let total = 0;
    let correct = 0;
    for (const r of rows) {
      if (perQuestionIds.get(r.questionId) === t.id) {
        total += r.total;
        correct += r.correct;
      }
    }
    return { track: t, total, correct };
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="font-mono text-[11px] uppercase tracking-widest text-signal">
        Practice Quiz
      </div>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        실전 퀴즈
      </h1>
      <p className="mt-2 text-sm text-mute">
        총 {QUESTIONS.length}문제. 트랙당 {questionsByTrack(TRACKS[0].id).length}
        문항 내외이며, 선택 즉시 채점과 해설이 나옵니다. 모든 시도는 기록에
        남아 면접 직전 오답 복습의 재료가 됩니다.
      </p>
      {!learnerId ? (
        <p className="mt-2 text-xs text-dim">
          ※ 프로필이 없으면 채점은 되지만 기록이 저장되지 않습니다.
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {trackStats.map(({ track: t, total, correct }) => {
          const count = questionsByTrack(t.id).length;
          const acc = total === 0 ? null : Math.round((correct / total) * 100);
          return (
            <Link
              key={t.id}
              href={`/quiz/${t.id}`}
              className="group rounded-xl border border-line bg-panel p-5 transition-all hover:-translate-y-0.5 hover:border-edge"
            >
              <div className="flex items-center justify-between">
                <span
                  className="rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: t.color, border: `1px solid ${t.color}55` }}
                >
                  {t.code}
                </span>
                <span className="font-mono text-[11px] text-dim">{count} 문항</span>
              </div>
              <h2 className="mt-3 font-display text-lg font-bold group-hover:text-signal">
                {t.name}
              </h2>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-mute">
                {t.description}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                {acc === null ? (
                  <span className="text-[11px] text-dim">아직 시도 없음</span>
                ) : (
                  <span className="text-[11px] text-mute">
                    {total}회 풀이 · 정답률{" "}
                    <span
                      className={
                        acc >= 70 ? "font-semibold text-pine" : "font-semibold text-alarm"
                      }
                    >
                      {acc}%
                    </span>
                  </span>
                )}
                <span className="text-xs font-semibold text-signal opacity-0 transition-opacity group-hover:opacity-100">
                  시작하기 →
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg border border-line bg-panel p-4">
        <div className="font-mono text-[10px] uppercase tracking-widest text-signal">
          면접 준비 기준
        </div>
        <p className="mt-2 text-xs leading-relaxed text-mute">
          전 트랙 정답률 70% 이상을 말로 설명할 수 있는 수준까지가 1차 목표입니다.
          90% 이상이라면 지원 동기서에 &ldquo;C 기초 역량을 자체 커리큘럼으로
          검증했다&rdquo;고 쓸 수 있습니다.
        </p>
      </div>
    </div>
  );
}
