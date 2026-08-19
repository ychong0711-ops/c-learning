export type Question = {
  id: string;
  trackId: string;
  lessonId: string;
  prompt: string;
  code?: string;
  options: [string, string, string, string];
  answer: number;
  explanation: string;
};

export const QUESTIONS: Question[] = [
  // ── basics-01 ──────────────────────────────────────────────
  {
    id: "q01",
    trackId: "basics",
    lessonId: "basics-01",
    prompt:
      "16비트 MCU와 32비트 ARM MCU 모두에서 정확히 2바이트 범위의 센서 보정값을 저장하려 합니다. 가장 적절한 타입은?",
    options: ["int", "unsigned short", "uint16_t", "long"],
    answer: 2,
    explanation:
      "int와 unsigned short, long의 크기는 플랫폼마다 다릅니다. stdint.h의 uint16_t만 존재한다면 항상 정확히 2바이트(0~65535)를 보장하므로 이식성이 필요한 자동차 코드에서 표준 선택입니다.",
  },
  {
    id: "q02",
    trackId: "basics",
    lessonId: "basics-01",
    prompt: "자동차 ECU 코드가 int 대신 uint8_t, uint16_t 같은 고정폭 타입을 선호하는 주된 이유는?",
    code: `uint8_t  gear;
uint16_t rpm;
uint32_t odometer;`,
    options: [
      "고정폭 타입이 항상 더 빠르기 때문에",
      "컴파일러·플랫폼에 상관없이 타입의 폭이 보장되어 데이터 교환이 결정적이기 때문에",
      "int는 부호가 없어서",
      "MISRA가 int 사용을 금지하기 때문에",
    ],
    answer: 1,
    explanation:
      "int의 크기는 구현 정의입니다(최소 16비트). CAN 통신이나 공유 메모리처럼 정확한 바이트 폭이 계약인 상황에서 플랫폼마다 크기가 달라지면 치명적입니다. MISRA가 int를 금지하지는 않습니다.",
  },
  // ── basics-02 ──────────────────────────────────────────────
  {
    id: "q03",
    trackId: "basics",
    lessonId: "basics-02",
    prompt: "다음 코드의 출력으로 옳은 것은?",
    code: `uint16_t mv = 5u / 2u * 1000u;`,
    options: ["2500", "2000", "3000", "0"],
    answer: 1,
    explanation:
      "정수 나눗셈은 버림입니다. 5/2 = 2이고, 같은 우선순위인 곱셈이 왼쪽에서 평가되어 2 * 1000 = 2000이 됩니다. 정밀도를 살리려면 곱셈을 앞으로: 5 * 1000 / 2 = 2500.",
  },
  {
    id: "q04",
    trackId: "basics",
    lessonId: "basics-02",
    prompt: "이 코드의 문제점으로 옳은 것은?",
    code: `uint8_t sensor = read_adc();
if (sensor = 0xFFu) {
    report_error();
}`,
    options: [
      "0xFFu는 음수 리터럴이라 오류",
      "== 대신 =를 써서 센서 값이 덮어쓰이고 조건이 항상 참이 됨",
      "report_error()는 if 안에서 호출할 수 없음",
      "uint8_t와 16진 상수는 비교할 수 없음",
    ],
    answer: 1,
    explanation:
      "sensor = 0xFFu는 할당문입니다. sensor가 0xFF로 덮어쓰이고, 식의 값 0xFF는 참이므로 report_error()가 항상 실행됩니다. 고전적 버그이며 정적 분석기가 경고합니다.",
  },
  // ── basics-03 ──────────────────────────────────────────────
  {
    id: "q05",
    trackId: "basics",
    lessonId: "basics-03",
    prompt:
      "led.c 안에서만 사용하는 helper 함수 write_port()를 다른 모듈에서 보이지 않게 하려면 어떤 키워드를 붙여야 하나요?",
    code: `static void write_port(uint8_t v) { /* ... */ }`,
    options: ["extern", "static", "const", "inline"],
    answer: 1,
    explanation:
      "파일 스코프의 static은 심볼의 링크 범위를 해당 번역 단위(.c 파일)로 제한합니다. C에서 모듈 내부 구현을 숨기는 기본 캡슐화 수단입니다.",
  },
  {
    id: "q06",
    trackId: "basics",
    lessonId: "basics-03",
    prompt: "헤더 가드(#ifndef / #define / #endif)의 역할로 옳은 것은?",
    code: `#ifndef LED_H
#define LED_H
/* ... 선언들 ... */
#endif`,
    options: [
      "헤더가 컴파일될 때마다 최적화를 켜는 것",
      "한 번역 단위에서 헤더가 여러 번 포함되어 선언이 중복되는 것을 막는 것",
      "헤더의 내용을 암호화하는 것",
      "헤더가 특정 컴파일러에서만 열리게 하는 것",
    ],
    answer: 1,
    explanation:
      "여러 헤더가 서로를 include하면 같은 헤더가 두 번 포함될 수 있습니다. 헤더 가드는 매크로가 이미 정의되어 있으면 내용을 건너뛰어 중복 선언 문제를 막습니다.",
  },
  // ── memory-01 ──────────────────────────────────────────────
  {
    id: "q07",
    trackId: "memory",
    lessonId: "memory-01",
    prompt: "이 코드를 실행한 뒤 voltage의 값은?",
    code: `uint16_t voltage = 3300u;
uint16_t *p = &voltage;
*p = 5000u;`,
    options: ["3300", "5000", "컴파일 에러", "미정의(UB)"],
    answer: 1,
    explanation:
      "p는 voltage의 주소를 보관합니다. *p = 5000u는 그 주소, 즉 voltage에 5000을 쓰는 것입니다. 역참조를 통한 간접 쓰기는 포인터의 기본 동작입니다.",
  },
  {
    id: "q08",
    trackId: "memory",
    lessonId: "memory-01",
    prompt:
      "uint32_t arr[8]; 에서 포인터 p가 arr[2]를 가리킬 때, p + 1이 가리키는 것과 실제 주소 증가량은?",
    options: [
      "arr[3], 주소는 1 증가",
      "arr[3], 주소는 sizeof(uint32_t)=4 증가",
      "arr[2] 그대로, 증가 없음",
      "arr[1], 주소는 4 감소",
    ],
    answer: 1,
    explanation:
      "포인터 산술은 가리키는 타입의 크기 단위로 이동합니다. uint32_t*에 +1은 4바이트 전진, 즉 다음 요소 arr[3]을 가리킵니다. arr[i]가 *(arr+i)와 같은 이유이기도 합니다.",
  },
  // ── memory-02 ──────────────────────────────────────────────
  {
    id: "q09",
    trackId: "memory",
    lessonId: "memory-02",
    prompt: "이 구조체의 sizeof가 보통 6이 아닌 12인 이유는?",
    code: `typedef struct {
    uint8_t  a;
    uint32_t b;
    uint8_t  c;
} Frame_t;`,
    options: [
      "컴파일러 버그",
      "정렬 요구사항 때문에 멤버 사이에 패딩 바이트가 들어가기 때문",
      "구조체는 항상 4의 배수 크기가 되도록 법으로 정해져 있어서",
      "uint32_t가 실제로는 8바이트라서",
    ],
    answer: 1,
    explanation:
      "대부분의 ABI는 멤버를 자기 크기 경계에 배치합니다. a(1B) 뒤에 3B 패딩, b(4B), c(1B) 뒤에 3B 패딩이 붙어 총 12바이트가 됩니다. 통신 직렬화 시에는 배치를 직접 관리해야 합니다.",
  },
  {
    id: "q10",
    trackId: "memory",
    lessonId: "memory-02",
    prompt: "두 선언의 차이로 옳은 것은?",
    code: `char a[] = "CAN";
char *p  = "CAN";`,
    options: [
      "완전히 동일하다",
      "a는 수정 가능한 배열 사본, p는 보통 읽기 전용 리터럴을 가리키므로 *p 수정은 UB",
      "p가 더 많은 메모리를 차지한다",
      "a는 문자열을 저장할 수 없다",
    ],
    answer: 1,
    explanation:
      "char a[] = \"CAN\"은 스택에 수정 가능한 사본을 만듭니다. char *p = \"CAN\"은 문자열 리터럴(보통 .rodata)을 가리키며 p[0] = 'X'처럼 수정하면 정의되지 않은 동작입니다.",
  },
  // ── memory-03 ──────────────────────────────────────────────
  {
    id: "q11",
    trackId: "memory",
    lessonId: "memory-03",
    prompt: "초기화하지 않은 전역 변수는 실행 이미지에서 어디에 배치되나요?",
    options: [".text", ".rodata", ".bss", "스택"],
    answer: 2,
    explanation:
      "초기값 없는 전역/static 변수는 .bss 섹션에 모이고, 스타트업 코드가 RAM을 0으로 채웁니다. .text는 코드, .rodata는 상수, 스택은 지역 변수 영역입니다.",
  },
  {
    id: "q12",
    trackId: "memory",
    lessonId: "memory-03",
    prompt:
      "안전 크리티컬 자동차 소프트웨어에서 malloc/free를 금지하는(MISRA Rule 21.3) 이유로 가장 적절한 것은?",
    options: [
      "malloc은 C99에서 삭제되었다",
      "응답 시간이 비결정적이고 단편화와 메모리 고갈 가능성이 있어 실패 시 동작을 보장할 수 없기 때문에",
      "malloc은 항상 느리다",
      "malloc은 전역 변수만 할당할 수 있어서",
    ],
    answer: 1,
    explanation:
      "동적 할당은 실행 시점에 메모리를 탐색하므로 시간이 불확실하고, 반복 사용 시 단편화가 생기며, 고갈 시 NULL을 반환합니다. 수명 전체의 안정성을 증명해야 하는 ECU에서는 이 불확실성을 허용할 수 없어 정적 할당으로 대체합니다.",
  },
  // ── bits-01 ──────────────────────────────────────────────
  {
    id: "q13",
    trackId: "bits",
    lessonId: "bits-01",
    prompt: "0xA5 & 0x3C 의 결과는?",
    options: ["0x3C", "0x24", "0xBD", "0x99"],
    answer: 1,
    explanation:
      "0xA5 = 1010 0101, 0x3C = 0011 1100. AND는 둘 다 1인 비트만 남깁니다: 0010 0100 = 0x24. 비트 추출의 기본 동작입니다.",
  },
  {
    id: "q14",
    trackId: "bits",
    lessonId: "bits-01",
    prompt: "32비트 값의 비트 31 마스크를 만드는 올바른 식은?",
    options: ["1 << 31", "1u << 31", "1 >> 31", "(int)0x80"],
    answer: 1,
    explanation:
      "1은 int입니다. 1 << 31은 int 범위 오버플로로 정의되지 않은 동작이 될 수 있습니다. 1u << 31은 unsigned로 0x80000000을 안전하게 만듭니다. 시프트 상수에는 항상 u를 붙이세요.",
  },
  // ── bits-02 ──────────────────────────────────────────────
  {
    id: "q15",
    trackId: "bits",
    lessonId: "bits-02",
    prompt: "레지스터 REG의 비트 3을 1로 설정하면서 다른 비트는 보존하는 코드는?",
    options: [
      "REG = (1u << 3);",
      "REG |= (1u << 3);",
      "REG &= (1u << 3);",
      "REG ^= (1u << 3);",
    ],
    answer: 1,
    explanation:
      "OR는 해당 비트만 1로 세팅하고 나머지는 보존합니다. REG = (1u<<3)은 다른 비트를 모두 0으로 지우고, &=는 반대로 비트 3만 남기고 모두 지우며, ^=는 토글입니다.",
  },
  {
    id: "q16",
    trackId: "bits",
    lessonId: "bits-02",
    prompt: "REG의 비트 5만 0으로 클리어하는 코드는?",
    options: [
      "REG |= ~(1u << 5);",
      "REG &= ~(1u << 5);",
      "REG ^= ~(1u << 5);",
      "REG = ~(1u << 5);",
    ],
    answer: 1,
    explanation:
      "~(1u << 5)는 비트 5만 0인 마스크입니다. AND는 0 마스크 위치만 0으로 지우고 나머지는 보존하므로 REG &= ~(1u << 5)가 정답입니다.",
  },
  // ── bits-03 ──────────────────────────────────────────────
  {
    id: "q17",
    trackId: "bits",
    lessonId: "bits-03",
    prompt: "GPIO 베이스 주소가 0x40020000이고 ODR 오프셋이 0x14일 때 ODR의 주소는?",
    options: ["0x40020014", "0x40021400", "0x40020001", "0x40034000"],
    answer: 0,
    explanation:
      "메모리 맵드 레지스터는 베이스 주소 + 오프셋입니다. 0x40020000 + 0x14 = 0x40020014. 데이터시트의 레지스터 맵 표를 이 방식으로 읽습니다.",
  },
  {
    id: "q18",
    trackId: "bits",
    lessonId: "bits-03",
    prompt: "레지스터 접근 매크로에 volatile 포인터 캐스팅을 쓰는 이유는?",
    code: `#define GPIOA_ODR (*(volatile uint32_t *)(0x40020000u + 0x14u))`,
    options: [
      "읽기 속도를 높이기 위해",
      "하드웨어가 언제든 값을 바꿀 수 있으므로 컴파일러가 읽기/쓰기를 최적화로 제거·캐싱하지 못하게 하려고",
      "포인터 크기를 줄이기 위해",
      "레지스터를 RAM에 복사해서 쓰기 위해",
    ],
    answer: 1,
    explanation:
      "volatile은 '이 메모리는 프로그램 밖에서 변한다'는 선언입니다. 없으면 컴파일러가 반복 읽기를 캐시하거나 쓰지 않는 것처럼 보이는 저장을 삭제해 하드웨어와 상태가 어긋납니다.",
  },
  // ── embedded-01 ──────────────────────────────────────────────
  {
    id: "q19",
    trackId: "embedded",
    lessonId: "embedded-01",
    prompt: "volatile 선언이 반드시 필요한 상황으로 가장 적절한 것은?",
    options: [
      "함수 안에서만 쓰이는 지역 변수",
      "인터럽트 핸들러가 변경하는 플래그를 메인 루프가 검사하는 경우",
      "const 상수 테이블",
      "모든 포인터 변수",
    ],
    answer: 1,
    explanation:
      "ISR이 바꾸는 변수를 일반 변수로 선언하면 컴파일러가 메인 루프의 읽기를 '변하지 않는다'고 판단해 최적화해 버릴 수 있습니다. HW 레지스터, ISR 공유, 태스크 공유 변수가 volatile의 3대 사용처입니다.",
  },
  {
    id: "q20",
    trackId: "embedded",
    lessonId: "embedded-01",
    prompt: "volatile이 보장하는 것과 보장하지 않는 것으로 옳은 조합은?",
    options: [
      "원자성 보장 / 메모리 배리어 비보장",
      "컴파일러의 캐싱·제거 방지 / 원자성·스레드 동기화는 보장하지 않음",
      "모든 동시성 문제를 해결 / 단점 없음",
      "런타임 성능 향상 / 타입 검사 비보장",
    ],
    answer: 1,
    explanation:
      "volatile은 컴파일러 최적화(읽기 캐싱, 죽은 저장 제거, 재배치)만 막습니다. read-modify-write의 원자성이나 멀티코어 메모리 순서는 임계 구역·원자 연산·배리어가 별도로 필요합니다.",
  },
  // ── embedded-02 ──────────────────────────────────────────────
  {
    id: "q21",
    trackId: "embedded",
    lessonId: "embedded-02",
    prompt: "인터럽트 핸들러(ISR) 작성 규칙으로 가장 적절한 것은?",
    options: [
      "진단 출력을 위해 printf를 호출해도 된다",
      "최대한 짧게, 블록되는 호출 없이 플래그만 남기고 무거운 처리는 태스크에 위임한다",
      "ISR 안에서는 전역 변수를 절대 쓸 수 없다",
      "ISR은 우선순위가 항상 가장 낮다",
    ],
    answer: 1,
    explanation:
      "ISR은 다른 실행을 멈추고 돌므로 짧아야 합니다. printf·지연·OS 대기 같은 블록 호출은 금지이며, 플래그를 세우고 실제 처리는 메인 루프/태스크에서 합니다.",
  },
  {
    id: "q22",
    trackId: "embedded",
    lessonId: "embedded-02",
    prompt: "ISR과 메인이 공유하는 카운터를 읽을 때 임계 구역(인터럽트 금지)으로 감싸는 이유는?",
    code: `__disable_irq();
uint32_t snap = tick_count;
__enable_irq();`,
    options: [
      "읽기 속도를 높이기 위해",
      "읽는 도중 ISR이 변수를 갱신하면 잘리거나 어긋난 값을 얻을 수 있기 때문에",
      "컴파일러 경고를 없애기 위해",
      "캐시 일관성을 위해서",
    ],
    answer: 1,
    explanation:
      "멀티바이트 값의 읽기/수정/쓰기 도중에 ISR이 끼어들면 일부만 갱신된 값을 보거나 갱신을 유실합니다. 공유 데이터 접근 구간을 임계 구역으로 감싸 원자적으로 만듭니다.",
  },
  // ── embedded-03 ──────────────────────────────────────────────
  {
    id: "q23",
    trackId: "embedded",
    lessonId: "embedded-03",
    prompt:
      "int 인자 하나를 받고 void를 반환하는 함수를 가리키는 함수 포인터의 올바른 선언은?",
    options: [
      "void *cb(int)",
      "void (*cb)(int)",
      "int (*cb)(void)",
      "void cb(*int)",
    ],
    answer: 1,
    explanation:
      "void (*cb)(int)는 'int를 받아 void를 반환하는 함수의 포인터'입니다. 실무에서는 typedef void (*Cb_t)(int); 로 별칭을 만들어 가독성을 확보합니다.",
  },
  {
    id: "q24",
    trackId: "embedded",
    lessonId: "embedded-03",
    prompt: "상태 머신 설계에서 전이 테이블(transition table)의 한 행을 구성하는 요소로 옳은 것은?",
    options: [
      "(현재 상태, 이벤트) → (다음 상태, 동작)",
      "(함수 이름, 인자 개수)",
      "(우선순위, 주기, WCET)",
      "(레지스터 주소, 오프셋)",
    ],
    answer: 0,
    explanation:
      "상태 머신은 '어떤 상태에서 어떤 이벤트가 오면, 어떤 상태로 가고 무엇을 하는가'의 표로 정의됩니다. 표를 먼저 그리고 switch/테이블 코드로 옮기면 누락 전이를 찾기 쉽습니다.",
  },
  // ── automotive-01 ──────────────────────────────────────────────
  {
    id: "q25",
    trackId: "automotive",
    lessonId: "automotive-01",
    prompt: "MISRA C:2012 규칙의 등급 체계로 옳은 것은?",
    options: [
      "Critical / Warning / Info",
      "Mandatory / Required / Advisory",
      "High / Medium / Low",
      "Must / Should / Could",
    ],
    answer: 1,
    explanation:
      "Mandatory는 편차 불가, Required는 준수 또는 문서화된 편차, Advisory는 권고입니다. 프로젝트는 정적 분석 도구로 검사하고 편차를 기능안전 절차에 따라 기록합니다.",
  },
  {
    id: "q26",
    trackId: "automotive",
    lessonId: "automotive-01",
    prompt: "MISRA C Rule 21.3이 malloc/free를 금지하는 근거로 가장 적절한 것은?",
    options: [
      "malloc은 표준 라이브러리가 아니기 때문에",
      "할당 실패·단편화·비결정적 응답 시간으로 런타임 동작을 증명할 수 없기 때문에",
      "malloc은 느리기만 할 뿐 안전 문제는 없기 때문에",
      "임베디드 컴파일러가 malloc을 지원하지 않기 때문에",
    ],
    answer: 1,
    explanation:
      "안전 크리티컬 시스템은 수명 전체의 동작을 증명해야 합니다. 동적 할당은 실패 가능성, 단편화, 비결정적 실행 시간을 도입하므로 금지하고 정적 할당으로 대체합니다.",
  },
  // ── automotive-02 ──────────────────────────────────────────────
  {
    id: "q27",
    trackId: "automotive",
    lessonId: "automotive-02",
    prompt: "_Static_assert를 쓰는 주된 이유는?",
    code: `_Static_assert(sizeof(uint32_t) == 4u,
               "타입 폭 오류");`,
    options: [
      "런타임에 예외를 던지기 위해",
      "가정(불변식)이 깨졌을 때 빌드 자체를 실패시켜 런타임 비용 없이 문제를 조기 검출하려고",
      "컴파일 속도를 높이기 위해",
      "변수 초기화를 자동화하기 위해",
    ],
    answer: 1,
    explanation:
      "_Static_assert는 컴파일 타임에 조건을 검증합니다. 타입 폭, 테이블 크기 같은 불변식이 깨지면 빌드가 멈추므로 실행 비용 0으로 계약을 강제합니다.",
  },
  {
    id: "q28",
    trackId: "automotive",
    lessonId: "automotive-02",
    prompt: "다음 코드가 구현하는 방어 기법의 이름은?",
    code: `uint8_t Clamp_U8(int32_t v) {
    if (v < 0)   { return 0u; }
    if (v > 255) { return 255u; }
    return (uint8_t)v;
}`,
    options: [
      "메모리 풀 할당",
      "포화(saturation) 연산 — 범위를 벗어난 값을 경계값으로 제한",
      "상태 머신 전이",
      "헤더 가드",
    ],
    answer: 1,
    explanation:
      "포화 연산은 범위를 벗어난 입력을 가장 가까운 경계값으로 고정하는 방어 기법입니다. 제어기 출력이 물리 한계를 넘지 않게 하는 자동차 SW의 기본 패턴입니다.",
  },
  // ── automotive-03 ──────────────────────────────────────────────
  {
    id: "q29",
    trackId: "automotive",
    lessonId: "automotive-03",
    prompt: "AUTOSAR 아키텍처에서 RTE(Runtime Environment)의 역할로 옳은 것은?",
    options: [
      "하드웨어 레지스터에 직접 접근하는 드라이버",
      "응용 소프트웨어(SW-C)와 기본 소프트웨어(BSW) 사이 통신을 중개하는 인터페이스 계층",
      "OS 스케줄러 그 자체",
      "테스트 자동화 도구",
    ],
    answer: 1,
    explanation:
      "SW-C는 Rte_Read_/Rte_Write_ API로만 데이터를 주고받습니다. RTE가 실제 BSW 모듈·다른 ECU와의 연결을 해결하므로, 애플리케이션은 하드웨어 배치와 분리되어 재사용됩니다.",
  },
  {
    id: "q30",
    trackId: "automotive",
    lessonId: "automotive-03",
    prompt: "AUTOSAR C 코드에서 Can_Init, Can_Write처럼 '모듈명_함수명' 명명 규칙을 쓰는 주된 이유는?",
    options: [
      "컴파일 속도를 높이기 위해",
      "수백 개 모듈이 하나의 실행 파일에 링크될 때 심볼 충돌을 막고 소속을 명확히 하기 위해",
      "C 표준이 요구하기 때문에",
      "함수 실행 시간을 줄이기 위해",
    ],
    answer: 1,
    explanation:
      "C에는 네임스페이스가 없습니다. ECU 전체 코드가 하나의 실행 파일로 링크되므로 모듈 접두어가 사실상 네임스페이스 역할을 하며, 코드만 보고도 소속 모듈을 알 수 있게 합니다.",
  },
];

export function questionsByLesson(lessonId: string): Question[] {
  return QUESTIONS.filter((q) => q.lessonId === lessonId);
}

export function questionsByTrack(trackId: string): Question[] {
  return QUESTIONS.filter((q) => q.trackId === trackId);
}

export function questionById(id: string): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}
