import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { lessonProgress } from "@/db/schema";
import { LESSONS, lessonById, trackById } from "@/data/course";
import { getLearnerId } from "@/lib/learner";
import CodeBlock from "@/components/CodeBlock";
import LessonCompleteButton from "@/components/LessonCompleteButton";
import QuizEngine from "@/components/QuizEngine";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lesson = lessonById(id);
  return { title: lesson ? `${lesson.title} — EMBED:C LAB` : "강의 없음" };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lesson = lessonById(id);
  if (!lesson) notFound();

  const track = trackById(lesson.trackId);
  const ordered = LESSONS;
  const idx = ordered.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? ordered[idx - 1] : null;
  const next = idx < ordered.length - 1 ? ordered[idx + 1] : null;

  const learnerId = await getLearnerId().catch(() => null);
  const rows = learnerId
    ? await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.learnerId, learnerId),
            eq(lessonProgress.lessonId, lesson.id),
            eq(lessonProgress.completed, true)
          )
        )
    : [];
  const completed = rows.length > 0;

  return (
    <div className="mx-auto max-w-3xl">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-2 font-mono text-[11px] text-dim">
        <Link href="/learn" className="hover:text-ink">
          학습
        </Link>
        <span>/</span>
        <span style={{ color: track?.color }}>{track?.code}</span>
        <span>/</span>
        <span className="text-mute">{lesson.title}</span>
      </nav>

      {/* 헤더 */}
      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: track?.color, border: `1px solid ${track?.color}55` }}
          >
            {track?.name}
          </span>
          <span className="rounded border border-line px-1.5 py-px text-[10px] text-mute">
            {lesson.level}
          </span>
          <span className="font-mono text-[11px] text-dim">약 {lesson.minutes}분</span>
          {completed ? (
            <span className="rounded border border-pine/50 bg-pine/10 px-1.5 py-px text-[10px] text-pine">
              완료됨
            </span>
          ) : null}
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {lesson.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-mute">{lesson.summary}</p>
        <div className="mt-4">
          <LessonCompleteButton
            lessonId={lesson.id}
            initiallyCompleted={completed}
            hasProfile={learnerId !== null}
          />
        </div>
      </header>

      {/* 본문 */}
      <div className="mt-8 space-y-10">
        {lesson.sections.map((sec, i) => (
          <section key={i}>
            <div className="flex items-baseline gap-3">
              <span
                className="font-display text-sm font-bold"
                style={{ color: track?.color }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="font-display text-lg font-bold">{sec.heading}</h2>
            </div>
            <p className="mt-2.5 text-[15px] leading-relaxed text-mute">{sec.body}</p>
            {sec.code ? (
              <div className="mt-3.5">
                <CodeBlock code={sec.code} caption={sec.caption} />
                {sec.caption ? (
                  <p className="mt-1.5 text-[11px] text-dim">▸ {sec.caption}</p>
                ) : null}
              </div>
            ) : null}
          </section>
        ))}
      </div>

      {/* 핵심 정리 */}
      <div className="mt-10 rounded-xl border border-signal/30 bg-signal/5 p-5">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-signal">
          핵심 정리
        </h3>
        <ul className="mt-3 space-y-2">
          {lesson.keyPoints.map((k, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
              <span>{k}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 확인 문제 */}
      <section className="mt-10">
        <h3 className="font-display text-lg font-bold">확인 문제</h3>
        <p className="mt-1 text-xs text-mute">
          이 강의에서 나온 문제입니다. 틀리면 해설을 읽고 본문을 다시 훑어보세요.
        </p>
        <div className="mt-4">
          <QuizEngine sourceUrl={`/api/quiz?lesson=${lesson.id}`} />
        </div>
      </section>

      {/* 이전/다음 */}
      <nav className="mt-10 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/learn/${prev.id}`}
            className="group rounded-lg border border-line bg-panel p-4 transition-colors hover:border-edge"
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
              ← 이전 강의
            </div>
            <div className="mt-1 truncate text-sm font-semibold group-hover:text-signal">
              {prev.title}
            </div>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/learn/${next.id}`}
            className="group rounded-lg border border-line bg-panel p-4 text-right transition-colors hover:border-edge"
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
              다음 강의 →
            </div>
            <div className="mt-1 truncate text-sm font-semibold group-hover:text-signal">
              {next.title}
            </div>
          </Link>
        ) : (
          <Link
            href="/quiz"
            className="rounded-lg border border-pine/40 bg-pine/5 p-4 text-right transition-colors hover:bg-pine/10"
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-pine">
              마지막 강의! →
            </div>
            <div className="mt-1 text-sm font-semibold text-pine">
              실전 퀴즈로 실력 검증
            </div>
          </Link>
        )}
      </nav>
    </div>
  );
}
