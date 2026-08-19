import { GLOSSARY } from "@/data/extra";

export const metadata = { title: "용어 사전 — EMBED:C LAB" };

export default function GlossaryPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="font-mono text-[11px] uppercase tracking-widest text-signal">
        Glossary
      </div>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        임베디드 용어 사전
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-mute">
        면접과 논문 읽기에서 반복 등장하는 핵심 용어 {GLOSSARY.length}개. 독일
        교수님과의 미팅에서 이 단어들이 자연스럽게 나와야 합니다.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {GLOSSARY.map((g) => (
          <div
            key={g.term}
            className="rounded-xl border border-line bg-panel p-5 transition-colors hover:border-edge"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-[15px] font-bold text-signal">
                {g.term}
              </h2>
            </div>
            <div className="mt-0.5 text-[11px] font-medium text-dim">{g.ko}</div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-mute">
              {g.definition}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
