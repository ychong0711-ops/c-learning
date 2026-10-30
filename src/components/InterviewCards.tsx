"use client";

import { useState } from "react";

type Card = { id: string; category: string; question: string; answer: string };

const CARDS: Card[] = [
  {
    id: "ic01",
    category: "포인터",
    question: "포인터 산술 `p + 1`은 주소를 1 증가시키나요?",
    answer:
      "아니요. `p + 1`은 `sizeof(*p)` 바이트만큼 이동합니다. `uint32_t *`라면 4바이트, 따라서 `arr[i]`와 `*(arr + i)`가 같은 이유이기도 합니다.",
  },
  {
    id: "ic02",
    category: "포인터",
    question: "이 두 선언의 차이는? `char a[] = \"CAN\";` vs `char *p = \"CAN\";`",
    answer:
      "`a`는 수정 가능한 배열 사본이고 `p`는 보통 읽기 전용 문자열 리터럴을 가리킵니다. `p[0] = 'X'`는 UB일 수 있습니다.",
  },
  {
    id: "ic03",
    category: "volatile/ISR",
    question: "volatile이 보장하는 것과 보장하지 않는 것은?",
    answer:
      "보장: 컴파일러 캐싱/제거/재배치 방지. 비보장: 원자성, 스레드 동기화, 메모리 순서. �임계 구역과 원자 연산이 따로 필요합니다.",
  },
  {
    id: "ic04",
    category: "volatile/ISR",
    question: "ISR 작성의 가장 중요한 규칙은?",
    answer:
      "짧게 작성, 블록되는 호출 금지, 플래그만 남기고 무거운 처리는 태스크/메인 루프에 위임. 인터럽트 금지 임계 구역으로 공유 데이터 보호.",
  },
  {
    id: "ic05",
    category: "메모리",
    question: "자동차 ECU에서 malloc을 금지하는 이유는?",
    answer:
      "비결정적 실행 시간, 단편화, 메모리 고갈 가능성 때문에 런타임 동작을 증명할 수 없기 때문입니다(MISRA 21.3). 정적 버퍼와 메모리 풀로 대체합니다.",
  },
  {
    id: "ic06",
    category: "메모리",
    question: ".bss와 .data의 차이는?",
    answer:
      ".data는 초기값 있는 전역/static, .bss는 초기값 없는 전역/static으로 스타트업 코드에서 0으로 채워집니다. .text/.rodata에는 코드와 상수가 들어갑니다.",
  },
  {
    id: "ic07",
    category: "비트 조작",
    question: "레지스터 비트 3을 설정하고 다른 비트를 보존하는 코드는?",
    answer:
      "`REG |= (1u << 3);` — OR 마스크. 클리어는 `REG &= ~(1u << 3);`, 토글은 `^=`, 읽기는 `(REG >> n) & 1u` 입니다.",
  },
  {
    id: "ic08",
    category: "비트 조작",
    question: "MMIO 레지스터에 volatile 포인터 캐스팅을 쓰는 이유는?",
    answer:
      "하드웨어가 언제든 값을 바꿀 수 있으므로 컴파일러가 읽기/쓰기를 캐시하거나 삭제하지 못하게 하기 위해서입니다.",
  },
  {
    id: "ic09",
    category: "MISRA C",
    question: "MISRA C 규칙 등급과 편차(deviation)란?",
    answer:
      "Mandatory / Required / Advisory. 편차는 필수 규칙 위반 시 사유, 영향 분석, 승인을 문서화하는 절차입니다.",
  },
  {
    id: "ic10",
    category: "AUTOSAR",
    question: "AUTOSAR에서 RTE의 역할은?",
    answer:
      "SW-C와 BSW 사이 통신을 중개합니다. SW-C는 Rte_Read_/Rte_Write_ API로만 세상과 통신하므로 하드웨어와 분리되어 재사용됩니다.",
  },
  {
    id: "ic11",
    category: "상태 머신",
    question: "상태 머신 전이 테이블의 한 행은 무엇으로 구성되나요?",
    answer:
      "`(현재 상태, 이벤트) → (다음 상태, 동작)`. 표를 먼저 그리고 코드로 옮기면 누락 전이를 찾기 쉽습니다.",
  },
  {
    id: "ic12",
    category: "방어적 코딩",
    question: "_Static_assert의 용도는?",
    answer:
      "컴파일 타임에 타입 폭, 테이블 크기 등 불변식을 빌드 실패로 검증합니다. 런타임 비용은 0입니다.",
  },
];

export default function InterviewCards() {
  const [category, setCategory] = useState("전체");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const categories = ["전체", ...Array.from(new Set(CARDS.map((c) => c.category)))];
  const filtered = category === "전체" ? CARDS : CARDS.filter((c) => c.category === category);
  const done = filtered.filter((c) => revealed[c.id]).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              category === c
                ? "border-signal/60 bg-signal/10 text-signal"
                : "border-line text-mute hover:text-ink"
            }`}
          >
            {c}
          </button>
        ))}
        <span className="ml-auto font-mono text-[10px] text-dim">
          {done}/{filtered.length} 확인
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((card) => (
          <article
            key={card.id}
            className="rounded-lg border border-line bg-panel p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded px-1.5 py-px font-mono text-[10px] text-aqua">
                {card.category}
              </span>
              <button
                type="button"
                onClick={() => setRevealed((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
                className="text-[10px] font-semibold text-signal"
              >
                {revealed[card.id] ? "답변 숨기기" : "답변 보기"}
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink">{card.question}</p>
            {revealed[card.id] ? (
              <p className="mt-3 rounded-md border border-line bg-canvas/60 p-3 text-xs leading-relaxed text-mute">
                {card.answer}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}