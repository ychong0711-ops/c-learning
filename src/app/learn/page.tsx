import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { lessonProgress } from "@/db/schema";
import { TRACKS, lessonsOfTrack, LESSONS } from "@/data/course";
import { getLearnerId } from "@/lib/learner";

export const metadata = { title: "학습 — EMBED:C LAB" };

export default async function LearnPage() {
  const learnerId = await getLearnerId().catch(() => null);
  const rows = learnerId
    ? await db
        .select()
        .from(lessonProgress)
        .where(and(eq(lessonProgress.learnerId, learnerId), eq(lessonProgress.completed, true)))
    : [];
  const completedIds = new Set(rows.map((r) => r.lessonId));
  const doneTotal = LESSONS.filter((l) => completedIds.has(l.id)).length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="font-mono text-[11px] uppercase tracking-widest text-signal">
        Curriculum
      </div>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        학습 트랙
      </h1>
      <p className="mt-2 text-sm text-mute">
        5개 트랙 · {LESSONS.length}강. 순서대로 완주하는 것을 권장하지만, 면접
        준비가 급하다면 TRK-04부터 시작해도 좋습니다.
      </p>
      {!learnerId ? (
        <p className="mt-2 text-xs text-dim">
          ※ 대시보드에서 프로필을 만들면 완료 상태가 저장됩니다.
        </p>
      ) : (
        <p className="mt-2 text-xs text-dim">
          진행: {doneTotal} / {LESSONS.length} 강의 완료
        </p>
      )}

      <div className="mt-8 space-y-10">
        {TRACKS.map((track) => {
          const lessons = lessonsOfTrack(track.id);
          const done = lessons.filter((l) => completedIds.has(l.id)).length;
          return (
            <section key={track.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className="rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: track.color, border: `1px solid ${track.color}55` }}
                  >
                    {track.code}
                  </span>
                  <h2 className="font-display text-lg font-bold">{track.name}</h2>
                  <span className="hidden text-xs text-dim sm:inline">{track.subtitle}</span>
                </div>
                <span className="font-mono text-[11px] text-dim">
                  {done}/{lessons.length} 완료
                </span>
              </div>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-mute">
                {track.description}
              </p>

              <div className="mt-4 overflow-hidden rounded-xl border border-line bg-panel">
                {lessons.map((lesson, i) => {
                  const completed = completedIds.has(lesson.id);
                  return (
                    <Link
                      key={lesson.id}
                      href={`/learn/${lesson.id}`}
                      className={`group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-raise/70 ${
                        i > 0 ? "border-t border-line" : ""
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] ${
                          completed
                            ? "border-pine/60 bg-pine/10 text-pine"
                            : "border-edge text-dim"
                        }`}
                      >
                        {completed ? "✓" : String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`truncate text-sm font-semibold ${
                            completed ? "text-mute" : "group-hover:text-signal"
                          }`}
                        >
                          {lesson.title}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs text-mute">
                          {lesson.summary}
                        </p>
                      </div>
                      <span className="hidden shrink-0 rounded border border-line px-1.5 py-px text-[10px] text-mute sm:inline">
                        {lesson.level}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-dim">
                        {lesson.minutes}분
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
