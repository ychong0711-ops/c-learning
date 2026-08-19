"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CodeBlock from "@/components/CodeBlock";
import ProgressRing from "@/components/ProgressRing";

type QuizQuestion = {
  id: string;
  prompt: string;
  code?: string;
  options: string[];
};

type Grade = {
  correct: boolean;
  answerIndex: number;
  explanation: string;
};

const LETTERS = ["A", "B", "C", "D"];

export default function QuizEngine({ sourceUrl }: { sourceUrl: string }) {
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setQuestions(null);
    setIdx(0);
    setPicked(null);
    setGrade(null);
    setCorrectCount(0);
    setFinished(false);
    setError(null);
    fetch(sourceUrl)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data: { questions: QuizQuestion[] }) => setQuestions(data.questions))
      .catch(() => setError("문제를 불러오지 못했습니다."));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceUrl]);

  if (error) {
    return (
      <div className="rounded-lg border border-alarm/40 bg-alarm/5 p-5 text-sm text-alarm">
        {error}
      </div>
    );
  }

  if (!questions) {
    return (
      <div className="space-y-3" aria-busy>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-raise/60" />
        ))}
        <p className="text-xs text-dim">문제를 불러오는 중…</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-panel p-5 text-sm text-mute">
        이 트랙에는 아직 등록된 문제가 없습니다.
      </div>
    );
  }

  if (finished) {
    const ratio = Math.round((correctCount / questions.length) * 100);
    const verdict =
      ratio === 100
        ? "완벽합니다. 이 트랙은 졸업입니다 — 다음 트랙으로!"
        : ratio >= 70
          ? "면접 합격선에 근접했습니다. 오답만 복습하세요."
          : ratio >= 40
            ? "해설을 읽고 해당 강의를 복습한 뒤 다시 도전하세요."
            : "강의를 먼저 완주하는 것을 권장합니다. 기초부터 천천히.";
    return (
      <div className="rounded-xl border border-line bg-panel p-6 text-center sm:p-10">
        <div className="flex justify-center">
          <ProgressRing
            percent={ratio}
            size={110}
            color={ratio >= 70 ? "var(--color-pine)" : ratio >= 40 ? "var(--color-signal)" : "var(--color-alarm)"}
            label={`${correctCount}/${questions.length}`}
            sub="정답"
          />
        </div>
        <h3 className="mt-5 font-display text-xl font-bold">
          {correctCount} / {questions.length} 정답 · 정답률 {ratio}%
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-mute">{verdict}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={load}
            className="rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-canvas transition-all hover:brightness-110 active:scale-[0.98]"
          >
            다시 도전
          </button>
          <Link
            href="/quiz"
            className="rounded-lg border border-line bg-raise px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-edge"
          >
            다른 트랙 풀기
          </Link>
          <Link
            href="/learn"
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-mute transition-colors hover:text-ink"
          >
            강의로 복습
          </Link>
        </div>
      </div>
    );
  }

  const q = questions[idx];

  const pick = async (i: number) => {
    if (picked !== null || submitting) return;
    setPicked(i);
    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: q.id, selectedIndex: i }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const g: Grade = await res.json();
      setGrade(g);
      if (g.correct) setCorrectCount((c) => c + 1);
    } catch {
      setError("채점 서버와 통신하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      setFinished(true);
    } else {
      setIdx(idx + 1);
      setPicked(null);
      setGrade(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {questions.map((qq, i) => (
            <span
              key={qq.id}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-6 bg-signal" : i < idx ? "w-3 bg-pine" : "w-3 bg-line"
              }`}
            />
          ))}
        </div>
        <span className="font-mono text-xs text-dim">
          Q{idx + 1} / {questions.length}
        </span>
      </div>

      <div className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <p className="text-[15px] font-medium leading-relaxed">{q.prompt}</p>
        {q.code ? (
          <div className="mt-4">
            <CodeBlock code={q.code} compact />
          </div>
        ) : null}

        <div className="mt-5 space-y-2.5">
          {q.options.map((opt, i) => {
            let cls = "border-line bg-canvas/40 hover:border-edge";
            if (picked !== null && grade) {
              if (i === grade.answerIndex) cls = "border-pine/70 bg-pine/10";
              else if (i === picked) cls = "border-alarm/70 bg-alarm/10";
              else cls = "border-line bg-canvas/40 opacity-55";
            } else if (i === picked) {
              cls = "border-signal/70 bg-signal/10";
            }
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={picked !== null || submitting}
                className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all ${cls} ${
                  picked === null ? "cursor-pointer active:scale-[0.995]" : "cursor-default"
                }`}
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-edge font-mono text-[11px] text-mute">
                  {LETTERS[i]}
                </span>
                <span className="font-mono text-[13px] leading-relaxed">{opt}</span>
              </button>
            );
          })}
        </div>

        {grade ? (
          <div
            className={`mt-5 rounded-lg border p-4 ${
              grade.correct
                ? "border-pine/40 bg-pine/8"
                : "border-alarm/40 bg-alarm/8"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`font-display text-sm font-bold ${
                  grade.correct ? "text-pine" : "text-alarm"
                }`}
              >
                {grade.correct ? "정답입니다" : `오답 — 정답은 ${LETTERS[grade.answerIndex]}`}
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-mute">
              {grade.explanation}
            </p>
            <button
              onClick={next}
              className="mt-4 rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-canvas transition-all hover:brightness-110 active:scale-[0.98]"
            >
              {idx + 1 >= questions.length ? "결과 보기 →" : "다음 문제 →"}
            </button>
          </div>
        ) : (
          <p className="mt-4 text-[11px] text-dim">
            보기를 선택하면 즉시 채점되고 해설이 표시됩니다. 모든 시도는 학습
            기록에 저장됩니다.
          </p>
        )}
      </div>
    </div>
  );
}
