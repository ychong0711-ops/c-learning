import Link from "next/link";
import { notFound } from "next/navigation";
import { trackById } from "@/data/course";
import { questionsByTrack } from "@/data/questions";
import QuizEngine from "@/components/QuizEngine";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = await params;
  const track = trackById(trackId);
  return { title: track ? `${track.name} 퀴즈 — EMBED:C LAB` : "퀴즈 없음" };
}

export default async function TrackQuizPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = await params;
  const track = trackById(trackId);
  if (!track) notFound();
  const count = questionsByTrack(trackId).length;

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="flex items-center gap-2 font-mono text-[11px] text-dim">
        <Link href="/quiz" className="hover:text-ink">
          실전 퀴즈
        </Link>
        <span>/</span>
        <span style={{ color: track.color }}>{track.code}</span>
      </nav>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {track.name} 퀴즈
          </h1>
          <p className="mt-1.5 text-sm text-mute">
            {track.subtitle} · 총 {count}문항
          </p>
        </div>
        <span className="rounded-lg border border-line bg-panel px-3 py-1.5 font-mono text-[11px] text-mute">
          즉석 채점 · 해설 제공
        </span>
      </header>

      <div className="mt-6">
        <QuizEngine sourceUrl={`/api/quiz?track=${trackId}`} />
      </div>
    </div>
  );
}
