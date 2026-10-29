"use client";

import { useEffect, useState } from "react";

const ITEMS = [
  "태블릿에 PWA 설치 (홈 화면에 추가)",
  "온라인에서 /standalone, /offline-ide, Shiro/TCC 1회 워밍",
  "비행기 모드에서 /, /standalone, /offline.html 열림 확인",
  "예제를 불러오고 코드를 에디터에 연다",
  "IDE로 전송 버튼 클릭",
  "/offline-ide 또는 브라우저 C IDE에서 실행",
  "출력을 expectedOutput과 비교",
  "JSON 백업 생성",
  "JSON 복원으로 진행도 검증",
];

const KEY = "embedc.standalone.checklist";

export default function StandaloneRoutineChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(checked));
    } catch {
      /* ignore */
    }
  }, [checked]);

  const done = ITEMS.filter((i) => checked[i]).length;

  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">빠른 사용 루틴 체크리스트</h2>
        <span className="rounded bg-pine/15 px-2 py-0.5 font-mono text-[10px] text-pine">
          {done}/{ITEMS.length}
        </span>
      </div>
      <p className="mt-2 text-sm text-mute">
        체크 상태는 브라우저에 저장됩니다.
      </p>
      <ul className="mt-3 space-y-2">
        {ITEMS.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-mute">
            <input
              type="checkbox"
              checked={!!checked[item]}
              onChange={(e) =>
                setChecked((prev) => ({ ...prev, [item]: e.target.checked }))
              }
              className="mt-1 accent-[#f0a13a]"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {done === ITEMS.length ? (
        <p className="mt-3 text-xs text-pine">모든 단계 완료 ✓</p>
      ) : null}
    </section>
  );
}