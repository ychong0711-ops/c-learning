"use client";

import { useEffect, useState } from "react";

type Check = { label: string; ok: boolean; detail: string };

export default function OfflineSmokeCheck() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [manual, setManual] = useState<Record<string, boolean>>({});
  const [storage, setStorage] = useState<string | null>(null);

  const runChecks = async () => {
    const results: Check[] = [];
    results.push({
      label: "브라우저 네트워크 상태",
      ok: typeof navigator !== "undefined",
      detail: typeof navigator !== "undefined" ? (navigator.onLine ? "online" : "offline") : "navigator 없음",
    });
    results.push({
      label: "Cache API 지원",
      ok: typeof caches !== "undefined",
      detail: typeof caches !== "undefined" ? "지원" : "미지원",
    });
    if (typeof caches !== "undefined") {
      const cached = await caches.match("/offline.html");
      results.push({
        label: "오프라인 fallback 캐시",
        ok: !!cached,
        detail: cached ? "캐시됨" : "미캐시",
      });
    }
    results.push({
      label: "IndexedDB 지원",
      ok: typeof indexedDB !== "undefined",
      detail: typeof indexedDB !== "undefined" ? "지원" : "미지원",
    });
    try {
      await (await import("@/lib/offlineStore")).getOfflineEntries();
      results.push({
        label: "IndexedDB 읽기",
        ok: true,
        detail: "정상",
      });
    } catch {
      results.push({
        label: "IndexedDB 읽기",
        ok: false,
        detail: "실패",
      });
    }
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      const used = est.usage ? (est.usage / 1024 / 1024).toFixed(2) : "0";
      const quota = est.quota ? (est.quota / 1024 / 1024).toFixed(0) : "unknown";
      setStorage(`${used} MB / ${quota} MB`);
    } else {
      setStorage("storage estimate 미지원");
    }
    setChecks(results);
  };

  useEffect(() => {
    runChecks();
  }, []);

  const manualItems = [
    "비행기 모드에서 / 페이지가 열린다",
    "비행기 모드에서 /standalone 페이지가 열린다",
    "비행기 모드에서 /offline.html 이 보인다",
    "예제 페이지를 읽고 오프라인에서도 접근 가능하다",
    "JSON 백업 파일이 생성된다",
    "JSON 복원으로 진행도가 복원된다",
    "Browser C IDE 링크가 열린다 (온라인 캐시 warm-up 후)",
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">자동 점검</h3>
        <button
          type="button"
          onClick={runChecks}
          className="rounded-md border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-mute hover:text-ink"
        >
          다시 점검
        </button>
      </div>
      <ul className="space-y-2">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center justify-between gap-3 rounded-md border border-line bg-panel px-3 py-2 text-xs">
            <span className="text-mute">{c.label}</span>
            <span className={c.ok ? "text-pine" : "text-alarm"}>
              {c.ok ? "✓" : "✗"} {c.detail}
            </span>
          </li>
        ))}
      </ul>
      {storage ? (
        <p className="font-mono text-[11px] text-dim">스토리지 사용량: {storage}</p>
      ) : null}

      <div>
        <h3 className="text-sm font-semibold text-ink">수동 점검</h3>
        <ul className="mt-2 space-y-2">
          {manualItems.map((item) => (
            <li key={item} className="flex items-center gap-2 text-xs text-mute">
              <input
                type="checkbox"
                checked={!!manual[item]}
                onChange={(e) => setManual((prev) => ({ ...prev, [item]: e.target.checked }))}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}