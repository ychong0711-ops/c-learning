import { Suspense } from "react";
import PlaygroundShell from "@/components/PlaygroundShell";
import BrowserIdePanel from "@/components/BrowserIdePanel";
import { getLearnerId } from "@/lib/learner";

export const metadata = { title: "코딩 연습장 — EMBED:C LAB" };

export default async function PlaygroundPage() {
  const learnerId = await getLearnerId().catch(() => null);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="font-mono text-[11px] uppercase tracking-widest text-signal">
        Live Playground
      </div>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        코딩 연습장
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mute">
        이 화면에서 쓴 C 코드가 서버의 <span className="font-mono text-ink">gcc</span>로
        실제 컴파일·실행됩니다. 실습 예제는{" "}
        <span className="text-pine">초급</span> ·{" "}
        <span className="text-signal">중급</span> ·{" "}
        <span className="text-alarm">고급</span>으로 나뉘어 있으니 순서대로
        도전하세요. 경고 0개로 빌드하는 것이 1차 목표입니다.
      </p>

      <div className="mt-6">
        <Suspense fallback={<div className="py-8 text-center font-mono text-xs text-dim">로딩 중…</div>}>
          <PlaygroundShell hasProfile={learnerId !== null} />
        </Suspense>
      </div>
      <div className="mt-6">
        <BrowserIdePanel />
      </div>
    </div>
  );
}
