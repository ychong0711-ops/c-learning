"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const GOALS = [
  "자동차 임베디드 SW 엔지니어",
  "독일 석사 과정 지원",
  "ECU 펌웨어 개발",
  "AUTOSAR / 기능안전",
  "C 기초 다지기",
];

export default function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(GOALS[1]);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      await fetch("/api/learner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, goal }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-signal/30 bg-panel p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-signal" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-signal">
          Profile Required
        </span>
      </div>
      <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        독일 자동차 임베디드 대학원,
        <br />
        C로 증명하는 학습을 시작합니다.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-mute">
        5개 트랙 · 15강 · 30문제의 실전 퀴즈. 학습 진행률과 퀴즈 기록이 프로필에
        저장되어 지원 동기서와 면접 준비의 근거가 됩니다.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-mute">이름 / 별명</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 김엔지니어"
            maxLength={24}
            className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-dim focus:border-signal"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-mute">목표 트랙</span>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm outline-none transition-colors focus:border-signal"
          >
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        onClick={start}
        disabled={busy}
        className="mt-5 rounded-lg bg-signal px-5 py-2.5 text-sm font-semibold text-canvas transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
      >
        {busy ? "생성 중..." : "학습 시작하기 →"}
      </button>
      <p className="mt-3 text-[11px] text-dim">
        프로필 없이도 강의 열람은 가능하지만, 진행률과 퀴즈 기록은 저장되지
        않습니다.
      </p>
    </div>
  );
}
