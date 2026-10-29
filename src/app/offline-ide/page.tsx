export const metadata = { title: "오프라인 C IDE — EMBED:C LAB" };

export default function OfflineIdePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-signal">
          Offline IDE
        </div>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          로컬 오프라인 C IDE
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">
          이 페이지는 저장소의 로컬 Shiro 번들을 사용합니다. 오프라인에서도 동작하지만,
          일부 외부 CDN 캐시가 필요한 경우는 처음 1회 온라인 로드가 필요할 수 있습니다.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-code" style={{ height: "70vh" }}>
        <iframe
          src="/offline-ide/shiro.html"
          title="Offline C IDE"
          className="h-full w-full border-0 bg-white"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href="/offline-ide/shiro.html"
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-signal/50 bg-signal/10 px-3 py-1.5 text-xs font-semibold text-signal hover:bg-signal/20"
        >
          새 탭에서 열기 ↗
        </a>
        <a
          href="https://shiro.computer"
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-mute hover:text-ink"
        >
          온라인 Shiro ↗
        </a>
      </div>
    </div>
  );
}