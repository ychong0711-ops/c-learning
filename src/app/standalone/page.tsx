import { getLearnerId } from "@/lib/learner";

export const metadata = { title: "독립 실행 가이드 — EMBED:C LAB" };

export default async function StandalonePage() {
  const learnerId = await getLearnerId().catch(() => null);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-signal">
          Standalone Mode
        </div>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          PC/서버 없이 태블릿에서 EMBED:C LAB 사용하기
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">
          PWA 오프라인 읽기 + 브라우저 C IDE + 네이티브 컴파일러(Termux/a-Shell)를 조합해
          Wi-Fi나 PC 서버 없이도 학습할 수 있습니다. 현재 프로필은{" "}
          {learnerId ? "서버와 동기화 가능합니다." : "오프라인 로컬 모드 기준으로 사용 가능합니다."}
        </p>
      </div>

      <section className="rounded-lg border border-line bg-panel p-4">
        <h2 className="text-lg font-semibold text-ink">1) PWA 오프라인 읽기</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-mute">
          <li>태블릿에서 사이트를 한 번 연다.</li>
          <li>브라우저 메뉴에서 <b>홈 화면에 추가</b>를 누른다.</li>
          <li>비행기 모드에서도 강의/예제/퀴즈를 연다.</li>
          <li>예제 완료 기록은 IndexedDB에 저장된다.</li>
        </ol>
        <p className="mt-3 text-xs text-dim">
          오프라인 fallback: <code>/offline.html</code>, IDE 안내: <code>/ide-offline.html</code>
        </p>
      </section>

      <section className="rounded-lg border border-line bg-panel p-4">
        <h2 className="text-lg font-semibold text-ink">2) 브라우저 C IDE로 코드 실행</h2>
        <p className="mt-2 text-sm text-mute">
          서버 gcc가 없어도 Shiro/TCC Wasm IDE에서 C 코드를 입력·컴파일·실행할 수 있습니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="https://shiro.computer" target="_blank" rel="noreferrer"
             className="rounded-md border border-signal/50 bg-signal/10 px-3 py-1.5 text-xs font-semibold text-signal">
            Shiro 열기 ↗
          </a>
          <a href="https://tcc.44670.org" target="_blank" rel="noreferrer"
             className="rounded-md border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-mute">
            TCC Wasm IDE ↗
          </a>
          <a href="/ide-offline.html"
             className="rounded-md border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-mute">
            오프라인 안내
          </a>
        </div>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-mute">
          <li>EMBED:C LAB 예제를 불러온다.</li>
          <li><b>IDE로 전송</b> 버튼을 누른다.</li>
          <li>브라우저 IDE에서 코드를 붙여넣고 Compile/Run한다.</li>
          <li>출력을 예상 출력과 비교한다.</li>
        </ol>
      </section>

      <section className="rounded-lg border border-line bg-panel p-4">
        <h2 className="text-lg font-semibold text-ink">3) Android 태블릿: Termux + clang</h2>
        <p className="mt-2 text-sm text-mute">
          실제 gcc/clang 환경이 필요하면 Android 태블릿에 Termux를 설치합니다.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md border border-line bg-code px-4 py-3 font-mono text-[12px] leading-relaxed text-ink">
{`pkg update && pkg upgrade -y
pkg install clang make git -y
clang --version

# 예시 컴파일/실행
clang -Wall -Wextra -std=c11 -O0 main.c -o main
./main`}
        </pre>
      </section>

      <section className="rounded-lg border border-line bg-panel p-4">
        <h2 className="text-lg font-semibold text-ink">4) iPad: a-Shell + clang</h2>
        <p className="mt-2 text-sm text-mute">
          iPad에서는 a-Shell을 설치한 뒤 clang을 사용할 수 있습니다.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md border border-line bg-code px-4 py-3 font-mono text-[12px] leading-relaxed text-ink">
{`clang --version
clang -Wall -Wextra -std=c11 -O0 main.c -o main
./main`}
        </pre>
      </section>

      <section className="rounded-lg border border-line bg-panel p-4">
        <h2 className="text-lg font-semibold text-ink">5) PWA 캐시 워밍</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-mute">
          <li>온라인 상태에서 아래 링크를 한 번씩 엽니다.</li>
          <li><a href="https://shiro.computer" target="_blank" rel="noreferrer" className="text-signal">Shiro</a>, <a href="https://tcc.44670.org" target="_blank" rel="noreferrer" className="text-signal">TCC Wasm IDE</a></li>
          <li>EMBED:C LAB의 독립 실행/연습장 페이지도 한 번씩 방문합니다.</li>
          <li>비행기 모드에서 핵심 페이지와 오프라인 안내 페이지가 열리는지 확인합니다.</li>
        </ol>
        <p className="mt-3 text-xs text-dim">
          Service Worker가 정적 자산과 핵심 라우트를 cache-first로 제공합니다.
          오프라인 실행 가능 여부는 <code>/ide-offline.html</code>에서 확인하세요.
        </p>
      </section>

      <section className="rounded-lg border border-line bg-panel p-4">
        <h2 className="text-lg font-semibold text-ink">6) 진행도 보존/복원</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-mute">
          <li>완료 기록은 IndexedDB에 저장됩니다.</li>
          <li>연결 복귀 시 서버로 자동 동기화를 시도합니다.</li>
          <li>코딩 연습장의 <b>JSON 백업</b>으로 진행도와 에디터 상태를 저장하세요.</li>
          <li>새 태블릿/브라우저에서는 <b>JSON 복원</b>으로 이어서 사용할 수 있습니다.</li>
        </ul>
      </section>
    </div>
  );
}