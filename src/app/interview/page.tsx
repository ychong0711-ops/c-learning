import InterviewCards from "@/components/InterviewCards";

export const metadata = { title: "면접 답변 카드 — EMBED:C LAB" };

export default function InterviewPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-signal">
          Interview Prep
        </div>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          면접 답변 카드
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          독일 자동차 임베디드 대학원/C 인터뷰에서 자주 나오는 핵심 질문을 짧은 답변 카드로 연습합니다.
        </p>
      </div>
      <InterviewCards />
    </div>
  );
}