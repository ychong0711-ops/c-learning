"use client";

import { useEffect, useState } from "react";

const SHIRO_URL = "https://shiro.computer";
const TCC_URL = "https://tcc.44670.org";

export default function BrowserIdePanel() {
  const [code, setCode] = useState(
    '#include <stdio.h>\n\nint main(void) {\n    printf("Hello, EMBED:C LAB!\\n");\n    return 0;\n}\n'
  );
  const [stdin, setStdin] = useState("");
  const [copied, setCopied] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<string | null>(null);
  const [warming, setWarming] = useState(false);

  useEffect(() => {
    checkCache();
  }, []);

  const warmCache = async () => {
    setWarming(true);
    setCacheStatus(null);
    const urls = [
      window.location.origin + "/",
      window.location.origin + "/offline.html",
      window.location.origin + "/ide-offline.html",
      window.location.origin + "/standalone",
      "https://shiro.computer/",
      "https://tcc.44670.org/",
    ];
    const results = await Promise.allSettled(
      urls.map((u) => fetch(u, { mode: u.startsWith("http") && !u.startsWith(window.location.origin) ? "no-cors" : "cors" }))
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    setCacheStatus(`캐시 워밍 시도 완료: ${ok}/${urls.length} 성공`);
    setWarming(false);
  };

  const checkCache = async () => {
    if (!("caches" in window)) {
      setCacheStatus("Cache API 미지원");
      return;
    }
    try {
      const home = await caches.match(window.location.origin + "/offline.html");
      const shiro = await caches.match("https://shiro.computer/");
      const tcc = await caches.match("https://tcc.44670.org/");
      setCacheStatus(
        [
          `로컬 오프라인 fallback: ${home ? "캐시됨" : "미캐시"}`,
          `Shiro: ${shiro ? "캐시됨" : "미캐시"}`,
          `TCC: ${tcc ? "캐시됨" : "미캐시"}`,
        ].join(" · ")
      );
    } catch {
      setCacheStatus("캐시 상태 확인 실패");
    }
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ code?: string; stdin?: string }>).detail;
      if (detail && typeof detail.code === "string") {
        setCode(detail.code);
        if (typeof detail.stdin === "string") setStdin(detail.stdin);
      }
    };
    window.addEventListener("embedc:ide-code", handler);
    return () => window.removeEventListener("embedc:ide-code", handler);
  }, []);

  const sendToPlayground = () => {
    window.dispatchEvent(
      new CustomEvent("embedc:playground-code", { detail: { code, stdin } })
    );
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 클립보드 사용 불가 */
    }
  };

  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-signal">
            Browser C IDE
          </div>
          <h3 className="mt-1 text-sm font-semibold text-ink">
            브라우저에서 바로 C 코드를 작성·실행
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-mute">
            서버 gcc 없이도 브라우저 안에서 C를 컴파일할 수 있습니다. 오프라인/태블릿 환경에
            권장합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={SHIRO_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-signal/50 bg-signal/10 px-3 py-1.5 text-xs font-semibold text-signal hover:bg-signal/20"
          >
            Shiro 열기 ↗
          </a>
          <a
            href={TCC_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-mute hover:text-ink"
          >
            TCC Wasm IDE ↗
          </a>
          <a
            href="/ide-offline.html"
            className="rounded-md border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-mute hover:text-ink"
          >
            오프라인 안내
          </a>
          <a
            href="/offline-ide"
            className="rounded-md border border-signal/50 bg-signal/10 px-3 py-1.5 text-xs font-semibold text-signal hover:bg-signal/20"
          >
            로컬 IDE 열기
          </a>
        </div>
      </div>

      <div className="mt-3">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={12}
          spellCheck={false}
          className="w-full resize-y rounded-md border border-line bg-code px-3 py-2 font-mono text-[12px] leading-relaxed text-ink outline-none focus:border-signal"
          placeholder="C 코드를 작성한 뒤 복사 버튼을 누르고 IDE에 붙여넣으세요."
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={copy}
            className="rounded-md border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-mute hover:text-ink"
          >
            {copied ? "복사됨 ✓" : "코드 복사"}
          </button>
          <button
            onClick={sendToPlayground}
            className="rounded-md border border-signal/50 bg-signal/10 px-3 py-1.5 text-xs font-semibold text-signal hover:bg-signal/20"
          >
            연습장으로 전송
          </button>
          <span className="font-mono text-[10px] text-dim">
            Ctrl/Cmd+Enter 대신 IDE의 Run 버튼을 사용하세요.
          </span>
        </div>
        <div className="mt-2">
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-dim">
            stdin
          </label>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            rows={2}
            spellCheck={false}
            placeholder="scanf 입력. 비워두면 EOF"
            className="w-full resize-y rounded-md border border-line bg-code px-3 py-2 font-mono text-[12px] leading-relaxed text-ink outline-none focus:border-signal"
          />
        </div>
      </div>

      <div className="mt-3 rounded-md border border-line bg-canvas/50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
            캐시 상태
          </span>
          <button
            type="button"
            onClick={checkCache}
            className="rounded-md border border-line bg-panel px-2.5 py-1 text-[11px] font-semibold text-mute hover:text-ink"
          >
            확인
          </button>
          <button
            type="button"
            onClick={warmCache}
            disabled={warming}
            className="rounded-md border border-signal/50 bg-signal/10 px-2.5 py-1 text-[11px] font-semibold text-signal hover:bg-signal/20 disabled:opacity-50"
          >
            {warming ? "워밍 중…" : "캐시 워밍"}
          </button>
        </div>
        {cacheStatus ? (
          <p className="mt-2 text-[11px] text-mute">{cacheStatus}</p>
        ) : null}
      </div>

      <details className="mt-3 text-xs text-mute">
        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-dim">
          사용 순서
        </summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[12px] leading-relaxed">
          <li>이 패널에서 코드를 작성하고 <b>코드 복사</b>를 누릅니다.</li>
          <li><b>Shiro 열기</b> 또는 <b>TCC Wasm IDE</b>를 누릅니다.</li>
          <li>IDE 에디터에 붙여넣고 Compile/Run을 실행합니다.</li>
          <li>출력을 EMBED:C LAB의 예상 출력과 비교합니다.</li>
          <li>오프라인에서는 PWA 캐시 + IDE 로컬 저장을 활용합니다.</li>
        </ol>
      </details>
    </section>
  );
}