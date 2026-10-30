"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PRACTICES } from "@/data/practice";
import { QUESTIONS } from "@/data/questions";

function dayIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

export default function DailyLearning() {
  const idx = useMemo(() => dayIndex(), []);
  const practice = PRACTICES[idx % PRACTICES.length];
  const quiz = useMemo(() => {
    const start = idx % QUESTIONS.length;
    return [0, 1, 2].map((n) => QUESTIONS[(start + n) % QUESTIONS.length]);
  }, [idx]);

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const storageKey = `embedc.daily.${new Date().toISOString().slice(0, 10)}`;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [storageKey]);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {
      /* ignore */
    }
  }, [checked, storageKey]);

  const steps = [
    { id: "read", label: "강의/예제 설명 읽기" },
    { id: "code", label: "코드 이해/손코딩" },
    { id: "run", label: "연습장에서 실행" },
    { id: "quiz", label: "퀴즈 3문항 풀기" },
  ];
  const done = steps.filter((s) => checked[s.id]).length;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-panel p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="font-mono text-[11px] uppercase tracking-widest text-signal">
            오늘의 10분 학습
          </div>
          <span className="rounded bg-pine/15 px-2 py-0.5 font-mono text-[10px] text-pine">
            {done}/{steps.length}
          </span>
        </div>
        <p className="mt-2 text-sm text-mute">
          오늘 날짜 기준으로 자동 선택된 예제와 퀴즈입니다. 매일 짧게 반복하는 것이 목표입니다.
        </p>
        <ul className="mt-3 space-y-2">
          {steps.map((s) => (
            <li key={s.id} className="flex items-center gap-2 text-sm text-mute">
              <input
                type="checkbox"
                checked={!!checked[s.id]}
                onChange={(e) => setChecked((prev) => ({ ...prev, [s.id]: e.target.checked }))}
                className="accent-[#f0a13a]"
              />
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-line bg-panel p-4">
        <h2 className="text-lg font-semibold text-ink">{practice.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">{practice.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/playground?example=${practice.id}`}
            className="rounded-md border border-signal/50 bg-signal/10 px-3 py-1.5 text-xs font-semibold text-signal hover:bg-signal/20"
          >
            연습장에서 실행
          </Link>
          <Link
            href="/offline-ide"
            className="rounded-md border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-mute hover:text-ink"
          >
            오프라인 IDE
          </Link>
        </div>
        <p className="mt-3 text-xs text-dim">핵심 포인트</p>
        <ul className="mt-1 space-y-1 text-xs text-mute">
          {practice.keyPoints?.slice(0, 4).map((k) => (
            <li key={k}>• {k}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-line bg-panel p-4">
        <h2 className="text-lg font-semibold text-ink">오늘의 퀴즈 3문항</h2>
        <div className="mt-3 space-y-3">
          {quiz.map((q, i) => (
            <div key={q.id || i} className="rounded-md border border-line bg-canvas/60 p-3">
              <p className="text-sm text-mute">{q.prompt}</p>
              <button
                type="button"
                onClick={() => setRevealed((prev) => ({ ...prev, [q.id || String(i)]: !prev[q.id || String(i)] }))}
                className="mt-2 text-[11px] font-semibold text-signal"
              >
                {revealed[q.id || String(i)] ? "정답 숨기기" : "정답 보기"}
              </button>
              {revealed[q.id || String(i)] ? (
                <p className="mt-2 text-xs text-pine">
                  {q.options[q.answer]} — {q.explanation}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}