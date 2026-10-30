"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CodeEditor from "@/components/CodeEditor";
import {
  DEFAULT_CODE,
  EXAMPLES,
  EXAMPLE_LEVELS,
  LEVEL_COLOR,
  LEVEL_HINT,
} from "@/data/examples";
import {
  PRACTICES,
  PRACTICE_TOPICS,
  TOPIC_COLOR,
} from "@/data/practice";
import {
  clearWrongNotes,
  getOfflineEntries,
  getWrongNotes,
  saveOfflineEntry,
  saveWrongNote,
  syncOfflineEntries,
} from "@/lib/offlineStore";
import type { WrongNote } from "@/lib/offlineStore";

type RunResult = {
  ok: boolean;
  stage: "compile" | "run";
  exitCode: number | null;
  timedOut: boolean;
  diagnostics: string;
  stdout: string;
  stderr: string;
  timeMs: number;
  errors: number;
  warnings: number;
  compileCommand: string;
  expectedOutput?: string;
};

type Snippet = {
  id: number;
  name: string;
  code: string;
  stdin: string;
  updatedAt: string;
};

const LS = {
  code: "embedc.code",
  stdin: "embedc.stdin",
  std: "embedc.std",
  opt: "embedc.opt",
  werror: "embedc.werror",
  name: "embedc.name",
};

function DiagnosticLines({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <pre className="overflow-x-auto whitespace-pre px-4 py-3 font-mono text-[12px] leading-relaxed">
      {text.split("\n").map((line, i) => {
        const cls = line.includes("error:")
          ? "text-alarm"
          : line.includes("warning:")
            ? "text-signal"
            : line.includes("note:")
              ? "text-aqua"
              : "text-mute";
        return (
          <div key={i} className={cls}>
            {line || " "}
          </div>
        );
      })}
    </pre>
  );
}

export default function PlaygroundShell({ hasProfile }: { hasProfile: boolean }) {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [stdin, setStdin] = useState("");
  const [std, setStd] = useState("c11");
  const [opt, setOpt] = useState("-O0");
  const [werror, setWerror] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const [snippetName, setSnippetName] = useState("새 스니펫");
  const [activeSnippetId, setActiveSnippetId] = useState<number | null>(null);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [loadedExample, setLoadedExample] = useState<string>("");
  const [offlineCompleted, setOfflineCompleted] = useState<string[]>([]);
  const [offlineSyncMsg, setOfflineSyncMsg] = useState<string | null>(null);
  const [wrongNotes, setWrongNotes] = useState<WrongNote[]>([]);

  const outputRef = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);

  // 로컬 저장소에서 복원
  useEffect(() => {
    try {
      const c = localStorage.getItem(LS.code);
      if (c !== null) setCode(c);
      const s = localStorage.getItem(LS.stdin);
      if (s !== null) setStdin(s);
      const st = localStorage.getItem(LS.std);
      if (st) setStd(st);
      const o = localStorage.getItem(LS.opt);
      if (o) setOpt(o);
      const w = localStorage.getItem(LS.werror);
      if (w === "1") setWerror(true);
      const n = localStorage.getItem(LS.name);
      if (n) setSnippetName(n);
    } catch {
      /* localStorage 없음 */
    }
    hydrated.current = true;
  }, []);

  // 자동 저장 (디바운스)
  useEffect(() => {
    if (!hydrated.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(LS.code, code);
        localStorage.setItem(LS.stdin, stdin);
        localStorage.setItem(LS.std, std);
        localStorage.setItem(LS.opt, opt);
        localStorage.setItem(LS.werror, werror ? "1" : "0");
        localStorage.setItem(LS.name, snippetName);
      } catch {
        /* 무시 */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [code, stdin, std, opt, werror, snippetName]);

  const refreshSnippets = useCallback(async () => {
    if (!hasProfile) return;
    try {
      const res = await fetch("/api/snippets");
      if (!res.ok) return;
      const data = (await res.json()) as { snippets: Snippet[] };
      setSnippets(data.snippets);
    } catch {
      /* 무시 */
    }
  }, [hasProfile]);

  useEffect(() => {
    refreshSnippets();
  }, [refreshSnippets]);

  // 오프라인 완료 기록 로드 + 서버 동기화
  useEffect(() => {
    const load = async () => {
      try {
        const rows = await getOfflineEntries();
        setOfflineCompleted(rows.map((r) => r.id));
        const notes = await getWrongNotes();
        setWrongNotes(notes);
        const online = typeof navigator !== "undefined" ? navigator.onLine : true;
        if (online) {
          const res = await syncOfflineEntries();
          if (res.synced > 0) setOfflineSyncMsg(`${res.synced}건 동기화 완료`);
          const rows2 = await getOfflineEntries();
          setOfflineCompleted(rows2.map((r) => r.id));
        }
      } catch {
        /* IndexedDB 미지원 */
      }
    };
    load();
  }, []);

  // 브라우저 C IDE -> 연습장 코드/stdin 수신
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ code?: string; stdin?: string }>).detail;
      if (detail && typeof detail.code === "string") {
        setCode(detail.code);
        if (typeof detail.stdin === "string") setStdin(detail.stdin);
        setResult(null);
      }
    };
    window.addEventListener("embedc:playground-code", handler);
    return () => window.removeEventListener("embedc:playground-code", handler);
  }, []);

  const run = async () => {
    if (running) return;
    setRunning(true);
    setRunError(null);
    setResult(null);
    try {
      const res = await fetch("/api/playground/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, stdin, std, opt, werror, exampleId: loadedExample }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = (await res.json()) as RunResult & { expectedOutput?: string };
      setResult(data);

      // 오답노트 자동 저장
      const isCompileFail = data.stage === "compile" && !data.ok;
      const isRunFail = data.stage === "run" && (!data.ok || data.timedOut || data.exitCode !== 0);
      const isMismatch =
        !!data.expectedOutput && (data.stdout?.trim() ?? "") !== data.expectedOutput.trim();
      if (isCompileFail || isRunFail || isMismatch) {
        const stage = isCompileFail
          ? "compile"
          : isMismatch
            ? "mismatch"
            : "run";
        await saveWrongNote({
          exampleId: loadedExample || undefined,
          stage,
          diagnostics: data.diagnostics,
          stdout: data.stdout,
          stderr: data.stderr,
          expectedOutput: data.expectedOutput,
          code,
        });
        setWrongNotes(await getWrongNotes());
      }

      // Practice completion tracking: offline-first, server sync attempted
      if (data.stage === "run" && data.ok && data.stdout) {
        const loadedPrac = PRACTICES.find((p) => p.id === loadedExample);
        if (loadedPrac) {
          await saveOfflineEntry(loadedPrac.id, "practice");
          setOfflineCompleted((prev) =>
            prev.includes(loadedPrac.id) ? prev : [...prev, loadedPrac.id]
          );
          if (hasProfile) {
            try {
              const res = await fetch("/api/practice/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ practiceId: loadedPrac.id }),
              });
              if (res.ok) {
                const rows = await getOfflineEntries();
                // mark locally synced copy by refreshing offline list
                setOfflineCompleted(rows.map((r) => r.id));
              }
            } catch {
              setOfflineSyncMsg("오프라인에 저장됨 — 연결 복귀 후 동기화");
            }
          }
        }
      }
      requestAnimationFrame(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    } catch {
      setRunError("실행 서버와 통신하지 못했습니다.");
    } finally {
      setRunning(false);
    }
  };

  const saveSnippet = async () => {
    if (!hasProfile || running) return;
    setSaveMsg(null);
    try {
      const res = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeSnippetId ?? undefined,
          name: snippetName,
          code,
          stdin,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setSaveMsg(err.error ?? "저장 실패");
        return;
      }
      const data = (await res.json()) as { snippet: Snippet };
      setActiveSnippetId(data.snippet.id);
      setSaveMsg("저장됨 ✓");
      refreshSnippets();
    } catch {
      setSaveMsg("저장 실패");
    }
  };

  const loadSnippet = (s: Snippet) => {
    setCode(s.code);
    setStdin(s.stdin);
    setSnippetName(s.name);
    setActiveSnippetId(s.id);
    setLoadedExample("");
    setResult(null);
  };

  const deleteSnippet = async (id: number) => {
    if (!window.confirm("이 스니펫을 삭제할까요?")) return;
    await fetch(`/api/snippets?id=${id}`, { method: "DELETE" }).catch(() => {});
    if (activeSnippetId === id) setActiveSnippetId(null);
    refreshSnippets();
  };

  const backupRef = useRef<HTMLInputElement>(null);

  const backupProgress = async () => {
    try {
      const snapshot = {
        version: 1,
        exportedAt: new Date().toISOString(),
        progress: await getOfflineEntries(),
        editor: { code, stdin, std, opt, werror, name: snippetName },
      };
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "embedc-backup.json";
      a.click();
      URL.revokeObjectURL(url);
      setOfflineSyncMsg("JSON 백업 생성됨");
    } catch {
      setOfflineSyncMsg("백업 실패");
    }
  };

  const restoreProgress = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as {
        progress?: Array<{ id: string; kind?: "practice" | "example" }>;
        editor?: {
          code?: string;
          stdin?: string;
          std?: string;
          opt?: string;
          werror?: boolean;
          name?: string;
        };
      };
      if (Array.isArray(data.progress)) {
        for (const entry of data.progress) {
          if (entry?.id) await saveOfflineEntry(entry.id, entry.kind ?? "practice");
        }
      }
      if (data.editor) {
        const e = data.editor;
        if (typeof e.code === "string") {
          setCode(e.code);
          localStorage.setItem(LS.code, e.code);
        }
        if (typeof e.stdin === "string") {
          setStdin(e.stdin);
          localStorage.setItem(LS.stdin, e.stdin);
        }
        if (e.std) {
          setStd(e.std);
          localStorage.setItem(LS.std, e.std);
        }
        if (e.opt) {
          setOpt(e.opt);
          localStorage.setItem(LS.opt, e.opt);
        }
        if (typeof e.werror === "boolean") {
          setWerror(e.werror);
          localStorage.setItem(LS.werror, e.werror ? "1" : "0");
        }
        if (e.name) {
          setSnippetName(e.name);
          localStorage.setItem(LS.name, e.name);
        }
      }
      const rows = await getOfflineEntries();
      setOfflineCompleted(rows.map((r) => r.id));
      setOfflineSyncMsg("복원 완료");
    } catch {
      setOfflineSyncMsg("복원 실패");
    }
  };

  const loadExample = (id: string) => {
    setLoadedExample(id);
    const ex = EXAMPLES.find((e) => e.id === id);
    if (!ex) {
      const p = PRACTICES.find((p) => p.id === id);
      if (!p) return;
      setCode(p.code);
      setStdin(p.stdin ?? "");
      setSnippetName(p.title.replace(/^\d+\s·\s/, ""));
      setActiveSnippetId(null);
      setResult(null);
      window.dispatchEvent(new CustomEvent("embedc:ide-code", { detail: { code: p.code, stdin: p.stdin ?? "" } }));
      return;
    }
    setCode(ex.code);
    setStdin(ex.stdin ?? "");
    setSnippetName(ex.title.replace(/^\d+\s·\s/, ""));
    setActiveSnippetId(null);
    setResult(null);
    window.dispatchEvent(new CustomEvent("embedc:ide-code", { detail: { code: ex.code, stdin: ex.stdin ?? "" } }));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      {/* ─────────── 메인 컬럼 ─────────── */}
      <div className="min-w-0">
        {/* 툴바 */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2.5">
          <select
            value={loadedExample}
            onChange={(e) => e.target.value && loadExample(e.target.value)}
            className="max-w-52 rounded-md border border-line bg-canvas px-2 py-1.5 text-xs outline-none focus:border-signal"
            aria-label="예제 선택"
          >
            <option value="">예제 불러오기…</option>
            {EXAMPLE_LEVELS.map((lv) => {
              const group = EXAMPLES.filter((ex) => ex.level === lv);
              if (group.length === 0) return null;
              return (
                <optgroup key={lv} label={`${lv} (${group.length})`}>
                  {group.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title}
                    </option>
                  ))}
                </optgroup>
              );
            })}
            <optgroup key="auto" label="자동차 심화 (18)">
              {PRACTICES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </optgroup>
          </select>
          <select
            value={std}
            onChange={(e) => setStd(e.target.value)}
            className="rounded-md border border-line bg-canvas px-2 py-1.5 font-mono text-xs outline-none focus:border-signal"
            aria-label="C 표준"
          >
            <option value="c99">-std=c99</option>
            <option value="c11">-std=c11</option>
            <option value="c17">-std=c17</option>
            <option value="gnu17">-std=gnu17</option>
          </select>
          <select
            value={opt}
            onChange={(e) => setOpt(e.target.value)}
            className="rounded-md border border-line bg-canvas px-2 py-1.5 font-mono text-xs outline-none focus:border-signal"
            aria-label="최적화 단계"
          >
            <option value="-O0">-O0</option>
            <option value="-O1">-O1</option>
            <option value="-O2">-O2</option>
            <option value="-Os">-Os</option>
          </select>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-canvas px-2 py-1.5 font-mono text-xs text-mute">
            <input
              type="checkbox"
              checked={werror}
              onChange={(e) => setWerror(e.target.checked)}
              className="accent-[#f0a13a]"
            />
            -Werror
          </label>
          <span className="hidden font-mono text-[10px] text-dim sm:inline">
            -Wall -Wextra 상시 적용
          </span>
          <button
            onClick={run}
            disabled={running}
            className="ml-auto inline-flex items-center gap-2 rounded-md bg-signal px-4 py-1.5 text-sm font-bold text-canvas transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
          >
            {running ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-canvas/40 border-t-canvas" />
                빌드 중…
              </>
            ) : (
              <>▶ 실행</>
            )}
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("embedc:ide-code", { detail: { code, stdin } }))}            className="rounded-md border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-mute hover:text-ink"
            title="현재 코드를 브라우저 C IDE로 전송"
          >
            IDE로 전송
          </button>
        </div>

        {/* 편집기 */}
        <div className="mt-3">
          <CodeEditor value={code} onChange={setCode} onRun={run} minHeight={400} />
          <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-dim">
            <span>main.c · 공백 4칸 들여쓰기 · Ctrl+Enter 실행</span>
            <span>{code.length.toLocaleString()}자</span>
          </div>
        </div>

        {/* 표준 입력 */}
        <div className="mt-3 rounded-lg border border-line bg-panel">
          <div className="border-b border-line/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-dim">
            표준 입력 (stdin)
          </div>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="scanf / getchar가 읽을 입력. 비워 두면 EOF 상태로 실행됩니다."
            rows={2}
            spellCheck={false}
            className="w-full resize-y bg-transparent px-3 py-2 font-mono text-[12px] leading-relaxed text-ink outline-none placeholder:text-dim/70"
          />
        </div>

        {/* 출력 콘솔 */}
        <div ref={outputRef} className="mt-3 overflow-hidden rounded-lg border border-line bg-code">
          <div className="flex items-center justify-between border-b border-line/70 px-3 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
              Output Console
            </span>
            {result ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {result.stage === "compile" && !result.ok ? (
                  <span className="rounded bg-alarm/15 px-1.5 py-px font-mono text-[10px] text-alarm">
                    빌드 실패
                  </span>
                ) : result.timedOut ? (
                  <span className="rounded bg-alarm/15 px-1.5 py-px font-mono text-[10px] text-alarm">
                    시간 초과
                  </span>
                ) : result.exitCode === 0 ? (
                  <span className="rounded bg-pine/15 px-1.5 py-px font-mono text-[10px] text-pine">
                    실행 완료
                  </span>
                ) : (
                  <span className="rounded bg-signal/15 px-1.5 py-px font-mono text-[10px] text-signal">
                    종료 코드 {result.exitCode}
                  </span>
                )}
                <span className="rounded bg-raise px-1.5 py-px font-mono text-[10px] text-mute">
                  {result.timeMs}ms
                </span>
                {result.warnings > 0 ? (
                  <span className="rounded bg-signal/15 px-1.5 py-px font-mono text-[10px] text-signal">
                    경고 {result.warnings}
                  </span>
                ) : null}
                {result.warnings > 0 ? (
                  <span className="rounded bg-signal/15 px-1.5 py-px font-mono text-[10px] text-signal">
                    경고 {result.warnings}
                  </span>
                ) : null}
                {result.errors > 0 ? (
                  <span className="rounded bg-alarm/15 px-1.5 py-px font-mono text-[10px] text-alarm">
                    에러 {result.errors}
                  </span>
                ) : null}
                {result.expectedOutput ? (
                  <span
                    className={
                      result.stdout?.trim() === result.expectedOutput.trim()
                        ? "rounded bg-pine/15 px-1.5 py-px font-mono text-[10px] text-pine"
                        : "rounded bg-alarm/15 px-1.5 py-px font-mono text-[10px] text-alarm"
                    }
                  >
                    {result.stdout?.trim() === result.expectedOutput.trim() ? "✓ PASS" : "✗ FAIL"}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {running ? (
            <div className="flex items-center gap-3 px-4 py-6 font-mono text-xs text-mute">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-edge border-t-signal" />
              gcc 컴파일 → 실행 중…
            </div>
          ) : runError ? (
            <div className="px-4 py-4 text-sm text-alarm">{runError}</div>
          ) : result ? (
            <div className="divide-y divide-line/60">
              {result.compileCommand ? (
                <div className="px-4 py-2 font-mono text-[11px] text-dim">
                  $ {result.compileCommand}
                </div>
              ) : null}
              {result.diagnostics.trim() ? (
                <div>
                  <div className="px-4 pt-2.5 font-mono text-[10px] uppercase tracking-widest text-dim">
                    컴파일 진단
                  </div>
                  <DiagnosticLines text={result.diagnostics} />
                </div>
              ) : null}
              <div>
                <div className="px-4 pt-2.5 font-mono text-[10px] uppercase tracking-widest text-dim">
                  프로그램 출력
                </div>
                <pre className="overflow-x-auto whitespace-pre px-4 py-3 font-mono text-[13px] leading-relaxed text-ink">
                  {result.stdout || "(출력 없음)"}
                </pre>
              </div>
              {result.stderr.trim() ? (
                <div>
                  <div className="px-4 pt-2.5 font-mono text-[10px] uppercase tracking-widest text-dim">
                    표준 에러
                  </div>
                  <pre className="overflow-x-auto whitespace-pre px-4 py-3 font-mono text-[12px] leading-relaxed text-alarm">
                    {result.stderr}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="px-4 py-8 text-center font-mono text-xs text-dim">
              ▶ 실행을 누르면 gcc 12.2로 실제 컴파일·실행 결과가 여기에 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {/* ─────────── 사이드바 ─────────── */}
      <aside className="space-y-4">
        {/* 저장된 코드 */}
        <div className="rounded-lg border border-line bg-panel">
          <div className="border-b border-line/70 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-dim">
            저장된 코드 {hasProfile ? `(${snippets.length}/30)` : ""}
          </div>
          {hasProfile ? (
            <div className="p-3">
              <div className="flex gap-1.5">
                <input
                  value={snippetName}
                  onChange={(e) => {
                    setSnippetName(e.target.value);
                    setActiveSnippetId(null);
                  }}
                  maxLength={40}
                  placeholder="스니펫 이름"
                  className="min-w-0 flex-1 rounded-md border border-line bg-canvas px-2 py-1.5 text-xs outline-none focus:border-signal"
                />
                <button
                  onClick={saveSnippet}
                  className="shrink-0 rounded-md border border-signal/50 bg-signal/10 px-2.5 py-1.5 text-xs font-semibold text-signal transition-colors hover:bg-signal/20"
                >
                  {activeSnippetId ? "갱신" : "저장"}
                </button>
              </div>
              {saveMsg ? (
                <p className="mt-1.5 text-[11px] text-mute">{saveMsg}</p>
              ) : null}
              <ul className="mt-2.5 max-h-56 space-y-1 overflow-y-auto">
                {snippets.length === 0 ? (
                  <li className="py-2 text-[11px] text-dim">
                    아직 저장한 코드가 없습니다.
                  </li>
                ) : (
                  snippets.map((s) => (
                    <li
                      key={s.id}
                      className={`group flex items-center gap-1.5 rounded-md border px-2 py-1.5 ${
                        activeSnippetId === s.id
                          ? "border-signal/50 bg-signal/5"
                          : "border-transparent hover:border-line"
                      }`}
                    >
                      <button
                        onClick={() => loadSnippet(s)}
                        className="min-w-0 flex-1 truncate text-left text-xs text-mute hover:text-ink"
                        title={s.name}
                      >
                        {s.name}
                      </button>
                      <span className="shrink-0 font-mono text-[9px] text-dim">
                        {new Date(s.updatedAt).toLocaleDateString("ko-KR", {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </span>
                      <button
                        onClick={() => deleteSnippet(s.id)}
                        className="shrink-0 text-dim opacity-0 transition-opacity hover:text-alarm group-hover:opacity-100"
                        aria-label={`${s.name} 삭제`}
                      >
                        ✕
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : (
            <p className="p-3 text-[11px] leading-relaxed text-dim">
              프로필이 있으면 코드를 서버에 저장해 어디에서든 이어 쓸 수 있습니다.
              지금은 브라우저 자동 저장(로컬)으로 유지됩니다.
            </p>
          )}
        </div>

        {/* 오프라인 진행도 */}
        <div className="rounded-lg border border-line bg-panel p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
              오프라인 진행도
            </span>
            <span className="rounded bg-pine/15 px-1.5 py-px font-mono text-[10px] text-pine">
              {offlineCompleted.length}건
            </span>
          </div>
          {offlineSyncMsg ? (
            <p className="mt-2 text-[11px] text-mute">{offlineSyncMsg}</p>
          ) : (
            <p className="mt-2 text-[11px] text-dim">
              연결 복귀 시 자동 동기화됩니다.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={backupProgress}
              className="rounded-md border border-line bg-canvas px-2.5 py-1.5 text-[11px] font-semibold text-mute hover:text-ink"
            >
              JSON 백업
            </button>
            <button
              type="button"
              onClick={() => backupRef.current?.click()}
              className="rounded-md border border-line bg-canvas px-2.5 py-1.5 text-[11px] font-semibold text-mute hover:text-ink"
            >
              JSON 복원
            </button>
            <input
              ref={backupRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) restoreProgress(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {/* 오답노트 */}
        <div className="rounded-lg border border-line bg-panel p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
              오답노트 ({wrongNotes.length})
            </span>
            {wrongNotes.length > 0 ? (
              <button
                type="button"
                onClick={async () => {
                  await clearWrongNotes();
                  setWrongNotes([]);
                }}
                className="text-[10px] text-mute hover:text-alarm"
              >
                비우기
              </button>
            ) : null}
          </div>
          {wrongNotes.length === 0 ? (
            <p className="mt-2 text-[11px] text-dim">실패 기록이 없습니다.</p>
          ) : (
            <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">
              {wrongNotes.slice(0, 8).map((n) => (
                <li key={n.id} className="rounded border border-line bg-canvas/60 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-alarm">{n.stage}</span>
                    <span className="font-mono text-[9px] text-dim">
                      {new Date(n.createdAt).toLocaleString("ko-KR", {
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </span>
                  </div>
                  {n.exampleId ? (
                    <p className="mt-1 text-[10px] text-mute">예제: {n.exampleId}</p>
                  ) : null}
                  {n.diagnostics ? (
                    <pre className="mt-1 max-h-20 overflow-auto whitespace-pre-wrap font-mono text-[9px] text-mute">
                      {n.diagnostics.slice(0, 240)}
                    </pre>
                  ) : n.expectedOutput ? (
                    <p className="mt-1 text-[10px] text-mute">
                      예상 출력과 다름 · 실제: {(n.stdout || "(없음)").slice(0, 80)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 환경 정보 */}
        <div className="rounded-lg border border-line bg-panel p-3.5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
            빌드 환경
          </div>
          <dl className="mt-2 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <dt className="text-dim">컴파일러</dt>
              <dd className="text-mute">gcc 12.2 (Debian)</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-dim">기본 플래그</dt>
              <dd className="text-mute">-Wall -Wextra</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-dim">실행 제한</dt>
              <dd className="text-mute">CPU 4초 · 벽시계 6초</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-dim">메모리 제한</dt>
              <dd className="text-mute">256MB</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-dim">출력 제한</dt>
              <dd className="text-mute">48KB</dd>
            </div>
          </dl>
          <p className="mt-3 border-t border-line/70 pt-2.5 text-[11px] leading-relaxed text-dim">
            파일 시스템·네트워크 접근은 제한된 샌드박스에서 실행됩니다. 무한
            루프는 시간 초과로 자동 종료됩니다.
          </p>
        </div>

        {/* 예제 안내 */}
        {loadedExample ? (
          (() => {
            const ex = EXAMPLES.find((e) => e.id === loadedExample);
            if (!ex) {
              const p = PRACTICES.find((p) => p.id === loadedExample);
              if (!p) return null;
              const color = TOPIC_COLOR[p.topic];
              return (
                <div className="rounded-lg border border-aqua/30 bg-aqua/5 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-aqua">
                      예제 가이드
                    </span>
                    <span
                      className="rounded px-1.5 py-px text-[10px] font-semibold"
                      style={{ color, border: `1px solid ${color}55` }}
                    >
                      {p.topic}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-mute">
                    {p.description}
                  </p>
                  <p className="mt-2 border-t border-aqua/20 pt-2 text-[11px] leading-relaxed text-dim">
                    {p.keyPoints?.map((kp) => (
                      <span key={kp} className="rounded px-1 py-0.5 text-[9px] text-dim">
                        {kp}
                      </span>
                    )) ?? ""}
                  </p>
                </div>
              );
            }
            const color = LEVEL_COLOR[ex.level];
            return (
              <div className="rounded-lg border border-aqua/30 bg-aqua/5 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-aqua">
                    예제 가이드
                  </span>
                  <span
                    className="rounded px-1.5 py-px text-[10px] font-semibold"
                    style={{ color, border: `1px solid ${color}55` }}
                  >
                    {ex.level}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-mute">
                  {ex.description}
                </p>
                <p className="mt-2 border-t border-aqua/20 pt-2 text-[11px] leading-relaxed text-dim">
                  {ex.keyPoints?.map((kp) => (
                    <span key={kp} className="rounded px-1 py-0.5 text-[9px] text-dim">
                      {kp}
                    </span>
                  )) ?? ""}
                </p>
              </div>
            );
          })()
        ) : (
          <div className="rounded-lg border border-line bg-panel p-3.5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
              예제 난이도
            </div>
            <ul className="mt-2 space-y-1.5">
              {EXAMPLE_LEVELS.map((lv) => {
                const color = LEVEL_COLOR[lv];
                const count = EXAMPLES.filter((e) => e.level === lv).length;
                return (
                  <li key={lv} className="flex items-center gap-2 text-[11px] text-mute">
                    <span
                      className="rounded px-1.5 py-px text-[10px] font-semibold"
                      style={{ color, border: `1px solid ${color}55` }}
                    >
                      {lv}
                    </span>
                    {count}개 — {LEVEL_HINT[lv]}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
