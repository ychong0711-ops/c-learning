# EMBED:C LAB — 자동차 임베디드 C 학습 플랫폼

![Lighthouse PWA Audit](https://github.com/ychong0711-ops/c-learning/actions/workflows/lighthouse.yml/badge.svg)

독일 자동차 임베디드 대학원 입학을 목표로 하는 C 언어 학습 플랫폼입니다.
포인터·비트 조작·volatile·ISR·MISRA C·AUTOSAR까지, 임베디드 관점에서 C를 체계적으로 학습합니다.

## 주요 기능

- **대시보드** — 강의 완료율, 퀴즈 정답률, 트랙 완주 현황을 시각적으로 추적
- **학습 트랙** — 5개 트랙 · 20+강의. 순서대로 완주 권장
- **코딩 연습장** — 브라우저에서 C 코드를 실제 `gcc`로 컴파일·실행 (메모리/CPU 제한 적용)
- **실전 퀴즈** — 학습 내용 점검 및 오답 기록 관리
- **실습 예제** — 기본 문법부터 AUTOSAR, CAN, ISO-TP, TARA까지 38개 예제 (기본 22 + 심화 18 PRACTICES). expectedOutput 기반 auto-verification PASS/FAIL 및 keyPoints 노출
- **용어 사전 / 프로젝트 로드맵** — 면접 준비 지원

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| 언어 | TypeScript 5.9 |
| UI | React 19, Tailwind CSS 4 |
| ORM | Drizzle ORM 0.45 |
| 데이터베이스 | PostgreSQL (pg) |
| 테스트 | Vitest 4, React Testing Library |
| 코드 실행 | gcc + bash ulimit (샌드박스) |

## 시작하기

### 사전 요구사항

- Node.js 20+ (LTS 권장)
- PostgreSQL (로컬 또는 원격)
- gcc 컴파일러 (코딩 연습장용)

### 설치

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정 (.env 파일 생성)
# DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname>
```

`.env` 파일 예시:

```
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
```

### 데이터베이스 스키마 적용

```bash
# 스키마 생성 (drizzle-kit 사용)
npx drizzle-kit push
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

### 프로덕션 빌드 및 실행

```bash
npm run build
npm run start
```

### 한 번에 실행 (서버 + 브라우저 자동 오픈)

```bash
# start.bat 더블클릭 또는:
powershell -ExecutionPolicy Bypass -File start-with-browser.ps1
```

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | TypeScript 타입 검사 (`tsc --noEmit`) |
| `npm run test` | Vitest 테스트 실행 |
| `npm run test:ui` | Vitest UI 모드 |

## Lighthouse / PWA 자동 점검

GitHub Actions에서 Lighthouse PWA audit를 자동 실행합니다.

- 워크플로: `.github/workflows/lighthouse.yml`
- 설정: `lighthouserc.json`
- 대상 URL: `/`, `/standalone`, `/playground`, `/offline-check`
- 기준 점수:
  - PWA: `>= 0.9`
  - Performance: `>= 0.7`
  - Accessibility: `>= 0.8`
  - Best Practices: `>= 0.8`

로컬 실행:
```bash
npm run build
npm run start
npm run audit:lighthouse
```

## 프로젝트 구조

```
src/
├── app/                  # Next.js 라우트
│   ├── page.tsx          # 대시보드
│   ├── learn/            # 학습 트랙 / 강의 상세
│   ├── playground/       # 코딩 연습장
│   ├── quiz/             # 실전 퀴즈
│   ├── glossary/         # 용어 사전
│   ├── projects/         # 프로젝트 로드맵
│   └── api/              # API 라우트 (snippets, quiz, playground/run 등)
├── components/           # UI 컴포넌트
│   ├── CodeEditor.tsx    # 코드 에디터
│   ├── QuizEngine.tsx    # 퀴즈 엔진
│   ├── PlaygroundShell.tsx
│   └── ...
├── data/                 # 콘텐츠 데이터
│   ├── course.ts         # 트랙/강의 정의
│   ├── questions.ts      # 퀴즈 문항
│   ├── examples.ts       # 코딩 연습 예제
│   └── practice.ts       # 자동차 도메인 실습 예제 (12개)
├── db/                   # Drizzle 스키마 및 연결
│   ├── schema.ts         # learners, lessonProgress, snippets, quizAttempts
│   └── index.ts          # DB 연결 (DATABASE_URL)
└── lib/                  # 유틸리티
    ├── learner.ts        # 학습자 세션 관리
    └── crunner.ts        # C 코드 컴파일/실행 샌드박스
```

## 실습 예제 (src/data/practice.ts)

| # | 주제 | 레벨 |
|---|------|------|
| 01 | AUTOSAR 계층형 Gateway 리팩터링 | 고급 |
| 02 | CAN RX 인터럽트와 FreeRTOS Queue | 중급 |
| 03 | CAN TX Queue와 Gateway Routing | 중급 |
| 04 | DBC Signal Codec와 E2E 검증 | 중급 |
| 05 | DoIP 기반 Ethernet 진단과 CAN 진단 게이트웨이 | 고급 |
| 06 | FMEA와 Safety Mechanism 설계 | 고급 |
| 07 | ISO-TP 기반 최소 UDS 서버 | 고급 |
| 08 | SIL/HIL CAN 자동 검증 | 중급 |
| 09 | SOME-IP 기반 이더넷 게이트웨이와 AUTOSAR Adaptive 확장 | 고급 |
| 10 | 기술 발표와 면접 패키지 | 초급 |
| 11 | 실시간성·Jitter·Deadline 분석 | 중급 |
| 12 | 자동차 사이버보안 TARA | 고급 |
| 13-30 | PRACTICE 01-18 | 고급 | 자동차 도메인 심화 실습 (expectedOutput 기반 auto-verification PASS/FAIL, keyPoints 노출) |

## 학습 트랙

| 코드 | 트랙 | 설명 |
|------|------|------|
| TRK-01 | C 언어 기초 | 타입 크기, 제어 흐름, 컴파일 단위 |
| TRK-02 | 포인터와 메모리 | 포인터 산술, 구조체 패딩, 메모리 레이아웃 |
| TRK-03 | 비트 조작과 레지스터 | 비트 연산, 마스킹, MMIO |
| TRK-04 | 임베디드 핵심 패턴 | volatile, ISR, 상태 머신 |
| TRK-05 | 자동차 코딩 표준 | MISRA C, 방어적 코딩, AUTOSAR |

## 사용자 가이드

`USER_GUIDE.html` 파일을 브라우저에서 열면 플랫폼 사용법을 시각적으로 확인할 수 있습니다.

## 라이선스

Private project.