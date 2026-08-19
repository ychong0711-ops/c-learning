import { APPLICATION_TIPS, PROJECTS } from "@/data/extra";

export const metadata = { title: "프로젝트 로드맵 — EMBED:C LAB" };

const DIFF_COLOR: Record<string, string> = {
  입문: "#58c07d",
  중급: "#f0a13a",
  심화: "#e0605e",
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="font-mono text-[11px] uppercase tracking-widest text-signal">
        Portfolio Roadmap
      </div>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        프로젝트 로드맵
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mute">
        지원 서류에서 &ldquo;이 지원자는 C로 뭘 만들어 봤는가&rdquo;를 증명하는
        5단계 포트폴리오입니다. 각 단계는 이 플랫폼의 학습 트랙과 직접 연결되며,
        마지막 프로젝트는 앞 단계들을 하나의 AUTOSAR 스타일 아키텍처로 통합합니다.
      </p>

      <div className="relative mt-10 space-y-6">
        <div
          className="absolute bottom-6 left-[15px] top-2 hidden w-px bg-line sm:block"
          aria-hidden
        />
        {PROJECTS.map((p) => {
          const color = DIFF_COLOR[p.difficulty];
          return (
            <article
              key={p.id}
              className="relative rounded-xl border border-line bg-panel p-5 sm:ml-10 sm:p-6"
            >
              <span
                className="absolute -left-[41px] top-6 hidden h-8 w-8 items-center justify-center rounded-full border border-edge bg-canvas font-mono text-xs font-semibold sm:flex"
                style={{ color }}
              >
                {p.stage}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-dim sm:hidden">
                  STEP {p.stage}
                </span>
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-semibold"
                  style={{ color, border: `1px solid ${color}55` }}
                >
                  {p.difficulty}
                </span>
                <span className="rounded border border-line px-1.5 py-px text-[10px] text-mute">
                  예상 기간 {p.duration}
                </span>
              </div>
              <h2 className="mt-2.5 font-display text-lg font-bold">{p.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-mute">{p.description}</p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-dim">
                    핵심 기술
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded bg-raise px-2 py-1 font-mono text-[11px] text-mute"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-dim">
                    산출물 체크리스트
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {p.deliverables.map((d) => (
                      <li key={d} className="flex gap-2 text-xs leading-relaxed text-mute">
                        <span className="mt-0.5 text-signal">✓</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-signal/25 bg-signal/5 p-3.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-signal">
                  면접 포인트
                </span>
                <p className="mt-1.5 text-xs leading-relaxed text-mute">
                  {p.interviewPoint}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {/* 지원 준비 팁 */}
      <section className="mt-14">
        <h2 className="font-display text-lg font-bold">대학원 지원 준비 체크포인트</h2>
        <p className="mt-1 text-xs text-mute">
          학습과 프로젝트를 실제 지원 경쟁력으로 바꾸기 위한 실무 조언입니다.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {APPLICATION_TIPS.map((tip, i) => (
            <div key={i} className="rounded-lg border border-line bg-panel p-4">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold text-signal">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-sm font-semibold">{tip.title}</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-mute">{tip.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
