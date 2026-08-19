"use client";

import { useMemo, useRef } from "react";
import { tokenize } from "@/components/CodeBlock";

const MONO =
  "font-mono text-[13px] leading-6 whitespace-pre";

export default function CodeEditor({
  value,
  onChange,
  onRun,
  minHeight = 420,
}: {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  minHeight?: number;
}) {
  const preRef = useRef<HTMLPreElement>(null);
  const gutterInnerRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const lineCount = useMemo(() => value.split("\n").length, [value]);
  const tokens = useMemo(
    () => tokenize(value.endsWith("\n") ? value + " " : value),
    [value]
  );

  const syncScroll = () => {
    const ta = taRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterInnerRef.current) {
      gutterInnerRef.current.style.transform = `translateY(${-ta.scrollTop}px)`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onRun();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.slice(0, start) + "    " + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
  };

  return (
    <div
      className="flex overflow-hidden rounded-lg border border-line bg-code"
      style={{ minHeight }}
    >
      {/* 라인 번호 거터 */}
      <div className="w-11 shrink-0 select-none overflow-hidden border-r border-line/70 bg-canvas/50">
        <div
          ref={gutterInnerRef}
          className={`px-2 py-3 text-right ${MONO} text-dim`}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
      </div>

      {/* 편집 영역: 하이라이트 pre 위에 투명한 textarea */}
      <div className="relative min-w-0 flex-1">
        <pre
          ref={preRef}
          aria-hidden
          className={`pointer-events-none absolute inset-0 m-0 overflow-hidden px-4 py-3 ${MONO}`}
        >
          <code>
            {tokens.map((t, i) =>
              t.cls ? (
                <span key={i} className={t.cls}>
                  {t.text}
                </span>
              ) : (
                <span key={i}>{t.text}</span>
              )
            )}
          </code>
        </pre>
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          wrap="off"
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="C 코드 편집기"
          className={`absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent px-4 py-3 text-transparent caret-signal outline-none selection:bg-signal/25 ${MONO}`}
        />
      </div>
    </div>
  );
}
