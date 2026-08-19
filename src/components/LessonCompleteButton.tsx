"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useState } from "react";

export default function LessonCompleteButton({
  lessonId,
  initiallyCompleted,
  hasProfile,
}: {
  lessonId: string;
  initiallyCompleted: boolean;
  hasProfile: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useOptimistic(initiallyCompleted);

  const toggle = async () => {
    if (!hasProfile) {
      router.push("/");
      return;
    }
    const next = !completed;
    setCompleted(next);
    setBusy(true);
    try {
      await fetch("/api/lessons/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, completed: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 ${
        completed
          ? "border-pine/50 bg-pine/10 text-pine hover:bg-pine/15"
          : "border-line bg-raise text-ink hover:border-signal/60 hover:text-signal"
      }`}
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        {completed ? (
          <path
            d="M5.5 8.2l1.8 1.8 3.2-3.6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </svg>
      {completed ? "학습 완료됨 — 클릭하면 취소" : "학습 완료로 표시"}
      {!hasProfile ? (
        <span className="text-[11px] font-normal text-dim">(프로필 필요)</span>
      ) : null}
    </button>
  );
}
