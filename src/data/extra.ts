export type GlossaryTerm = {
  term: string;
  ko: string;
  definition: string;
};

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: "volatile",
    ko: "휘발성 수식자",
    definition:
      "이 객체가 프로그램 밖(하드웨어·ISR·다른 태스크)에서 변할 수 있으니 컴파일러가 읽기/쓰기를 최적화하지 말라는 지시. 원자성은 보장하지 않는다.",
  },
  {
    term: "ISR (Interrupt Service Routine)",
    ko: "인터럽트 서비스 루틴",
    definition:
      "인터럽트가 발생했을 때 실행되는 핸들러. 짧게 유지하고 블록 호출을 피하며, 실제 처리는 플래그로 위임한다.",
  },
  {
    term: "Critical Section",
    ko: "임계 구역",
    definition:
      "공유 데이터에 접근하는 동안 해당 인터럽트를 금지해 원자성을 확보하는 구간. 진입/탈출을 최소 범위로 유지하는 것이 실시간성의 핵심.",
  },
  {
    term: "Memory-Mapped I/O",
    ko: "메모리 맵드 I/O",
    definition:
      "주변장치 레지스터를 메모리 주소 공간에 배치하고 포인터 역참조로 접근하는 방식. *(volatile uint32_t*)(BASE + OFFSET) 공식.",
  },
  {
    term: "MISRA C",
    ko: "자동차 C 코딩 표준",
    definition:
      "안전 크리티컬 C 코드의 사실상 표준 규칙집. UB·구현 정의 동작·실수 유발 문법을 제한하며 Mandatory/Required/Advisory 등급을 가진다.",
  },
  {
    term: "AUTOSAR",
    ko: "자동차 SW 표준 아키텍처",
    definition:
      "ASW(애플리케이션)·RTE(통신)·BSW(기본 SW)의 3층 구조로 ECU 소프트웨어를 표준화하는 컨소시엄. 독일 OEM·티어1의 사실상 표준.",
  },
  {
    term: "Runnable",
    ko: "런너블",
    definition:
      "AUTOSAR에서 OS 알람/이벤트에 의해 주기적 또는 이벤트 트리거로 실행되는 void 함수. ECU 제어 로직의 기본 실행 단위.",
  },
  {
    term: "CAN (Controller Area Network)",
    ko: "CAN 버스",
    definition:
      "자동차 ECU 간 통신의 표준 직렬 버스. 아이디 기반 중재, 차동 신호로 내잡음성이 높다. 신호 단위의 데이터베이스가 DBC 파일.",
  },
  {
    term: "ECU (Electronic Control Unit)",
    ko: "전자 제어 장치",
    definition:
      "엔진, 변속기, 제동 등을 제어하는 차량 내 컴퓨터. MCU + 드라이버 + 응용 소프트웨어로 구성된다.",
  },
  {
    term: "Watchdog Timer",
    ko: "워치독 타이머",
    definition:
      "소프트웨어가 정해진 시간 안에 갱신(kick)하지 않으면 시스템을 리셋하는 안전 장치. 무한 루프·행(hang) 대비책.",
  },
  {
    term: ".bss Section",
    ko: "BSS 섹션",
    definition:
      "초기값 없는 전역/static 변수가 배치되는 RAM 영역. 스타트업 코드가 부팅 시 0으로 채운다. 실행 이미지 크기는 차지하지 않는다.",
  },
  {
    term: "Stack / Heap",
    ko: "스택 / 힙",
    definition:
      "스택은 지역 변수와 호출 정보(LIFO, 자동 관리), 힙은 동적 할당 영역. 자동차 SW는 힙 사용을 금지하고 정적 할당을 쓴다.",
  },
  {
    term: "Saturation",
    ko: "포화 연산",
    definition:
      "범위를 벗어난 값을 경계값으로 고정하는 방어 연산. 제어기 출력이 물리 한계를 넘지 않게 하는 기본 패턴.",
  },
  {
    term: "WCET (Worst-Case Execution Time)",
    ko: "최악 실행 시간",
    definition:
      "함수/태스크가 걸릴 수 있는 최악의 실행 시간. 스케줄링 가능성 분석의 입력값이며 실시간 시스템 설계의 핵심 지표.",
  },
  {
    term: "ISO 26262",
    ko: "자동차 기능안전 표준",
    definition:
      "전기·전자 시스템의 고장으로 인한 위험을 관리하는 기능안전 표준. ASIL 등급(A~D)으로 요구 강도를 구분하며 MISRA 준수와 연결된다.",
  },
  {
    term: "DBC / ARXML",
    ko: "통신 데이터베이스 포맷",
    definition:
      "DBC는 CAN 신호 정의(비트 위치·factor·offset) 포맷, ARXML은 AUTOSAR의 통신·설정 명세 포맷. 신호 정의가 곧 파서 코드로 번역된다.",
  },
];

export type Project = {
  id: string;
  stage: number;
  name: string;
  difficulty: "입문" | "중급" | "심화";
  duration: string;
  description: string;
  skills: string[];
  deliverables: string[];
  interviewPoint: string;
};

export const PROJECTS: Project[] = [
  {
    id: "p1",
    stage: 1,
    name: "디지털 타코미터 (RPM 디스플레이)",
    difficulty: "입문",
    duration: "1~2주",
    description:
      "ADC로 읽은 펄스 수를 RPM으로 변환해 7-세그먼트 또는 문자열로 출력하는 프로그램. 센서 → 변환 → 출력의 데이터 흐름을 C로 처음 끝까지 구현합니다.",
    skills: ["고정폭 타입", "비트 조작", "레지스터 접근", "포화 연산"],
    deliverables: [
      "HAL을 분리한 계층 구조 (hal.c / app.c)",
      "RPM 변환 공식 단위 테스트",
      "README에 레지스터 맵 표 정리",
    ],
    interviewPoint:
      "시트시트에 들어가는 첫 프로젝트로 적합합니다. 하드웨어 레지스터를 직접 다뤄 본 경험과 데이터 흐름 분리를 보여줄 수 있습니다.",
  },
  {
    id: "p2",
    stage: 2,
    name: "CAN 메시지 파서",
    difficulty: "중급",
    duration: "2~3주",
    description:
      "DBC 스타일의 신호 정의 테이블을 바탕으로 CAN 프레임 바이트에서 물리값을 추출·검증하는 라이브러리. 파일 입력으로 캡처 데이터를 받아 파싱합니다.",
    skills: ["구조체", "비트 추출/시프트", "빅/리틀 엔디언", "방어적 코딩"],
    deliverables: [
      "테이블 구동(table-driven) 파서 API",
      "엔디언·범위 예외 케이스 테스트",
      "신호 정의 헤더 (DBC를 C 매크로로 번역)",
    ],
    interviewPoint:
      "자동차 도메인 지식을 직접 증명하는 프로젝트입니다. '신호 정의가 어떻게 코드로 번역되는가'를 설명할 수 있다면 큰 가산점입니다.",
  },
  {
    id: "p3",
    stage: 3,
    name: "협력형 스케줄러 (Cooperative Scheduler)",
    difficulty: "중급",
    duration: "2~3주",
    description:
      "여러 작업(task)을 등록하고 주기·오프셋에 따라 순차 실행하는 라운드 로빈 스케줄러. Tick 카운트 기반의 시간 관리와 WCET 개념을 코드화합니다.",
    skills: ["함수 포인터", "상태 머신", "ISR/임계 구역", "타이머"],
    deliverables: [
      "Task 등록/실행 API (함수 포인터 테이블)",
      "오버플로 대응 Tick 카운터",
      "작업 실행 시간 측정 훅",
    ],
    interviewPoint:
      "AUTOSAR OS 태스크 개념의 축소판입니다. '왜 협력형인가, 선점형과 무엇이 다른가'라는 면접 단골 질문에 대한 실전 답이 됩니다.",
  },
  {
    id: "p4",
    stage: 4,
    name: "센서 드라이버 + 필터링 스택",
    difficulty: "심화",
    duration: "3~4주",
    description:
      "가상/실제 센서에서 주기적으로 샘플을 읽어 이동 평균·중앙값 필터를 거치고, 상태 머신으로 센서 단선/단락을 진단하는 드라이버 스택.",
    skills: ["링 버퍼", "정적 메모리 풀", "상태 머신", "진단(DTC)"],
    deliverables: [
      "계층 구조: HAL → Driver → Filter → Diagnostics",
      "단선/단락 진단 상태 머신 전이 테이블",
      "전부 정적 할당 — malloc 0회",
    ],
    interviewPoint:
      "기능안전(ISO 26262)과 진단(DTC) 개념까지 확장할 수 있어 대학원 연구 주제와 바로 연결됩니다.",
  },
  {
    id: "p5",
    stage: 5,
    name: "미니 AUTOSAR 스타일 아키텍처",
    difficulty: "심화",
    duration: "4주 이상",
    description:
      "1~4 프로젝트를 통합해 ASW/RTE/BSW 3층으로 재구성합니다. RTE는 Read/Write API로 추상화하고, 모듈 접두어·Std_ReturnType 관례를 적용합니다.",
    skills: ["AUTOSAR 계층", "RTE 추상", "명명 규칙", "MISRA 준수"],
    deliverables: [
      "App / Rte / Bsw 폴더 구조와 모듈 경계 문서",
      "MISRA 스타일 체크리스트와 자체 편차 기록",
      "통합 데모: RPM 제어 + 진단 + 스케줄링",
    ],
    interviewPoint:
      "지원 동기서의 결정적 증거가 됩니다. 'AUTOSAR 생태계를 이해하고, 표준 없이도 그 구조를 재현할 수 있는 지원자'라는 인상을 줍니다.",
  },
];

export const APPLICATION_TIPS = [
  {
    title: "전공 과목 성적 관리",
    body: "임베디드/자동차 전공 교수님들은 임베디드시스템, 실시간운영체제, 컴퓨터구조, 제어공학 과목을 봅니다. 수강 기록이 부족하면 MOOC·독학 내용을 프로젝트 README로 증명하세요.",
  },
  {
    title: "프로젝트는 GitHub에 문서와 함께",
    body: "코드보다 문서가 먼저 읽힙니다. 아키텍처 그림, 레지스터 맵 표, 테스트 결과를 README에 넣고, 커밋 메시지는 영문으로 꾸준히 남기세요.",
  },
  {
    title: "지원 동기서에 도메인 연결고리 만들기",
    body: "독일 대학원(TUM, KIT, Stuttgart, TU Braunschweig, RWTH 등)은 자동차 산업 연계 연구가 강점입니다. '왜 C인가 → 왜 임베디드인가 → 왜 이 연구실인가'를 이 학습 기록과 프로젝트로 연결하세요.",
  },
  {
    title: "영어 성적은 미리 준비, 독일어는 선택",
    body: "영어 석사 과정은 IELTS/TOEFL이 필수입니다. 독일어(B1 이상)는 필수는 아니지만 연구실 생활과 취업에 확실히 유리합니다.",
  },
  {
    title: "면접 시뮬레이션",
    body: "volatile, ISR 임계 구역, malloc 금지 이유, 상태 머신 — 이 플랫폼의 퀴즈 30문제를 말로 설명할 수 있는 수준이 면접 합격선입니다.",
  },
];
