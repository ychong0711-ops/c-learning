import OfflineSmokeCheck from "@/components/OfflineSmokeCheck";

export const metadata = { title: "오프라인 Smoke Check — EMBED:C LAB" };

export default function OfflineCheckPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-signal">
          Offline Smoke Check
        </div>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          독립형 오프라인 사용 점검
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          태블릿/브라우저에서 오프라인 사용 가능 여부를 자동/수동으로 확인합니다.
        </p>
      </div>
      <OfflineSmokeCheck />
    </div>
  );
}