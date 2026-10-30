import DailyLearning from "@/components/DailyLearning";

export const metadata = { title: "오늘의 10분 학습 — EMBED:C LAB" };

export default function DailyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-signal">
          Daily Learning
        </div>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          오늘의 10분 학습
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          매일 자동 선택되는 예제와 퀴즈로 짧고 반복 가능한 학습 루틴을 유지합니다.
        </p>
      </div>
      <DailyLearning />
    </div>
  );
}