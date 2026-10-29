"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/", label: "대시보드", hint: "학습 현황" },
  { href: "/learn", label: "학습", hint: "5개 트랙 · 15강" },
  { href: "/playground", label: "코딩 연습장", hint: "gcc 실습" },
  { href: "/quiz", label: "실전 퀴즈", hint: "30문제 채점" },
  { href: "/projects", label: "프로젝트 로드맵", hint: "포트폴리오" },
  { href: "/glossary", label: "용어 사전", hint: "임베디드 용어" },
  { href: "/standalone", label: "독립 실행", hint: "PWA/Termux/iPad" },
  { href: "/offline-check", label: "Smoke Check", hint: "오프라인 점검" },
];

function ChipIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="currentColor" />
      <path
        d="M9 6V3M15 6V3M9 21v-3M15 21v-3M6 9H3M6 15H3M21 9h-3M21 15h-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Sidebar({
  learnerName,
  learnerGoal,
}: {
  learnerName: string | null;
  learnerGoal: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [resetting, setResetting] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const resetProfile = async () => {
    if (!window.confirm("프로필과 학습 기록을 초기화할까요?")) return;
    setResetting(true);
    await fetch("/api/learner", { method: "DELETE" });
    router.refresh();
    setResetting(false);
  };

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-panel/70 lg:flex">
      <div className="flex items-center gap-3 border-b border-line px-5 py-5">
        <span className="text-signal">
          <ChipIcon />
        </span>
        <div>
          <div className="font-display text-lg font-bold tracking-tight">
            EMBED:C <span className="text-signal">LAB</span>
          </div>
          <div className="text-[11px] tracking-wide text-dim">
            AUTOMOTIVE EMBEDDED · DE
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
                  active
                    ? "bg-raise text-ink"
                    : "text-mute hover:bg-raise/60 hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      active ? "bg-signal" : "bg-edge group-hover:bg-dim"
                    }`}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </span>
                <span className="text-[10px] text-dim">{item.hint}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg border border-line bg-canvas/60 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-dim">
            목표 트랙
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-mute">
            독일 자동차 임베디드 대학원 합격 → 포트폴리오에 올릴 C 프로젝트 완성
          </p>
        </div>
      </nav>

      <div className="border-t border-line px-5 py-4">
        {learnerName ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{learnerName}</div>
              {learnerGoal ? (
                <div className="truncate text-[11px] text-dim">{learnerGoal}</div>
              ) : null}
            </div>
            <button
              onClick={resetProfile}
              disabled={resetting}
              className="shrink-0 rounded-md border border-line px-2 py-1 text-[11px] text-mute transition-colors hover:border-alarm hover:text-alarm disabled:opacity-50"
              title="프로필 초기화"
            >
              초기화
            </button>
          </div>
        ) : (
          <p className="text-[11px] leading-relaxed text-dim">
            프로필이 없습니다. 대시보드에서 시작하면 학습 기록이 저장됩니다.
          </p>
        )}
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-signal">
            <ChipIcon />
            <span className="font-display text-base font-bold tracking-tight text-ink">
              EMBED:C <span className="text-signal">LAB</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md border border-line bg-panel px-3 py-1.5 text-xs font-semibold text-mute hover:text-ink"
            aria-label="메뉴 열기"
          >
            ☰ 메뉴
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[80vw] overflow-y-auto border-r border-line bg-panel p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-signal">
                <ChipIcon />
                <span className="font-display text-base font-bold tracking-tight text-ink">
                  EMBED:C <span className="text-signal">LAB</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-line px-2 py-1 text-xs text-mute hover:text-alarm"
              >
                ✕
              </button>
            </div>
            <nav className="space-y-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive(item.href)
                      ? "bg-raise text-ink"
                      : "text-mute hover:bg-raise/60 hover:text-ink"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] text-dim">{item.hint}</span>
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
