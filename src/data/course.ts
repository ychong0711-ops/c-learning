export type Track = {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  description: string;
  color: string;
};

export type LessonSection = {
  heading: string;
  body: string;
  code?: string;
  caption?: string;
};

export type Lesson = {
  id: string;
  trackId: string;
  title: string;
  minutes: number;
  level: "입문" | "중급" | "심화";
  summary: string;
  sections: LessonSection[];
  keyPoints: string[];
};

export const TRACKS: Track[] = [
  {
    id: "basics",
    code: "TRK-01",
    name: "C 언어 기초",
    subtitle: "Types · Control Flow · Translation Unit",
    description:
      "임베디드 관점에서 다시 보는 C의 기본. 타입 크기, 제어 흐름, 컴파일 단위는 독일 자동차 SW 기업의 코딩 테스트 단골 주제입니다.",
    color: "#f0a13a",
  },
  {
    id: "memory",
    code: "TRK-02",
    name: "포인터와 메모리",
    subtitle: "Pointers · Structs · Memory Layout",
    description:
      "임베디드 C 면접의 핵심. 포인터 산술, 배열 붕괴, 구조체 패딩, 스택/힙/섹션 구조를 메모리 주소 수준에서 설명할 수 있어야 합니다.",
    color: "#58c07d",
  },
  {
    id: "bits",
    code: "TRK-03",
    name: "비트 조작과 레지스터",
    subtitle: "Bitwise Ops · Masking · MMIO",
    description:
      "MCU 드라이버의 언어. 비트 세트/클리어/토글과 메모리 맵드 레지스터 접근은 ECU 펌웨어 개발의 가장 기본적인 일상 업무입니다.",
    color: "#45b8ad",
  },
  {
    id: "embedded",
    code: "TRK-04",
    name: "임베디드 핵심 패턴",
    subtitle: "volatile · ISR · State Machine",
    description:
      "하드웨어와 실시간성을 다루는 C의 관용구. volatile, 인터럽트, 임계 구역, 함수 포인터 상태 머신을 실제 코드 패턴으로 익힙니다.",
    color: "#e0605e",
  },
  {
    id: "automotive",
    code: "TRK-05",
    name: "자동차 코딩 표준",
    subtitle: "MISRA C · Defensive Coding · AUTOSAR",
    description:
      "Bosch, Continental, OEM 협력사 코드의 표준. MISRA C 핵심 규칙과 방어적 코딩, AUTOSAR 아키텍처의 C 코드 관례를 배웁니다.",
    color: "#b9c2cc",
  },
];

export const LESSONS: Lesson[] = [
  // ─────────────────────────── TRK-01 C 언어 기초 ───────────────────────────
  {
    id: "basics-01",
    trackId: "basics",
    title: "데이터 타입과 고정폭 정수",
    minutes: 20,
    level: "입문",
    summary:
      "int의 크기는 플랫폼마다 다릅니다. 자동차 ECU 코드가 stdint.h의 uint8_t/uint16_t/uint32_t를 고집하는 이유를 이해합니다.",
    sections: [
      {
        heading: "C 기본 타입은 크기가 정해져 있지 않다",
        body: "C 표준이 보장하는 것은 char가 최소 1바이트, int가 최소 2바이트라는 것뿐입니다. int는 16비트 MCU에서는 2바이트, 32비트 ARM에서는 4바이트가 될 수 있습니다. 센서 값, CAN 메시지 페이로드, 캘리브레이션 상수를 int로 저장하면 플랫폼을 옮기는 순간 데이터 폭이 어긋납니다. 자동차 소프트웨어는 이식성과 결정성을 위해 고정폭 정수 타입을 사용합니다.",
        code: `#include <stdint.h>

uint8_t  gear_pos;    /* 항상 1바이트  0 ~ 255 */
uint16_t rpm_raw;     /* 항상 2바이트  0 ~ 65535 */
uint32_t odometer;    /* 항상 4바이트  0 ~ 4,294,967,295 */
int16_t  temp_c;      /* 부호 2바이트  -32768 ~ 32767 */`,
        caption: "stdint.h의 고정폭 타입 — AUTOSAR 기본 타입(uint8, uint16, uint32)의 원형입니다.",
      },
      {
        heading: "u 접미사와 부호 문제",
        body: "상수에 u를 붙이면 unsigned로 취급됩니다. signed와 unsigned를 섞어 비교하면 signed 피연산자가 unsigned로 변환되면서 -1이 거대한 양수가 되는 함정이 생깁니다. 부호 오버플로(signed overflow)는 C 표준에서 정의되지 않은 동작(UB)입니다. ECU 코드 리뷰에서 가장 먼저 걸러지는 패턴입니다.",
        code: `uint16_t speed = 120u;          /* unsigned 상수 권장 */

int16_t delta = sensor - target;
if (delta < 0) {                /* 부호가 의미 있을 땐 signed 타입 */
    heater_off();
}

/* 위험: unsigned 비교에서 -1은 0xFFFFFFFF가 됨 */
uint32_t len = get_len();
if (len < -1) { /* 사실상 항상 참/거짓이 꼬이는 코드 */ }`,
        caption: "부호 선택은 스타일이 아니라 계약입니다.",
      },
      {
        heading: "sizeof로 폭을 검증하라",
        body: "통신 프로토콜이나 파일 포맷처럼 정확한 바이트 수가 중요한 코드에서는 sizeof나 정적 단언으로 타입 폭을 보장합니다. 이 습관은 뒤에서 배울 방어적 코딩 트랙으로 이어집니다.",
        code: `#include <stdint.h>

_Static_assert(sizeof(uint32_t) == 4u, "uint32_t must be 4 bytes");
_Static_assert(sizeof(uint16_t) == 2u, "uint16_t must be 2 bytes");`,
        caption: "_Static_assert는 컴파일 타임에 조건을 검사합니다 (C11).",
      },
    ],
    keyPoints: [
      "int의 크기는 컴파일러·플랫폼에 따라 다르다. 임베디드에서는 고정폭 타입(uint8_t 등)을 쓴다.",
      "부호 있는 오버플로는 정의되지 않은 동작(UB)이다.",
      "unsigned 리터럴에는 u 접미사를 붙여 의도를 명시한다.",
      "sizeof와 _Static_assert로 타입 폭을 문서화하고 검증한다.",
    ],
  },
  {
    id: "basics-02",
    trackId: "basics",
    title: "연산자와 제어 흐름",
    minutes: 25,
    level: "입문",
    summary:
      "if/switch/for의 기본과 임베디드에서 특히 주의할 함정 — 할당과 비교 혼동, 정수 나눗셈, 단락 평가를 다룹니다.",
    sections: [
      {
        heading: "조건문과 흔한 함정",
        body: "if (x = 5)는 비교가 아니라 할당입니다. 결과가 5(참)이므로 조건은 항상 참이 됩니다. 고전적인 버그이며, 많은 팀이 상수를 왼쪽에 쓰는 Yoda 조건법이나 정적 분석기로 이를 차단합니다. 자동차 도메인에서는 MISRA C Rule 13.4가 할당 결과 사용을 제한합니다.",
        code: `uint8_t sensor = read_adc();

if (sensor == 0xFFu) {          /* 비교 == */
    report_error(ERR_SENSOR);
}

if (sensor = 0xFFu) {           /* 경고: 할당 = 이 항상 실행됨 */
    /* 의도와 다른 동작 */
}`,
        caption: "= 와 == 혼동은 코드 리뷰 1순위 검출 항목입니다.",
      },
      {
        heading: "정수 나눗셈과 나머지",
        body: "C의 정수 나눗셈은 소수점을 버립니다. 5 / 2는 2입니다. ADC 전압 변환처럼 스케일링이 필요한 계산에서는 나눗셈을 곱셈 뒤로 미루거나 명시적으로 형변환해 정밀도 손실을 통제해야 합니다. 0으로 나누는 것은 UB이며, 자동차 코드에서는 나누기 전 제수 검사가 필수입니다.",
        code: `uint16_t adc = 2048u;
uint16_t mv1 = adc / 4096u * 3300u;      /* 0 — 나눗셈이 먼저라 정밀도 소실 */
uint16_t mv2 = adc * 3300u / 4096u;      /* 1650 — 곱셈 먼저 */

uint16_t denom = get_divisor();
if (denom != 0u) {                       /* 제수 0 검사 */
    ratio = num / denom;
}`,
        caption: "연산 순서가 정밀도를 결정합니다.",
      },
      {
        heading: "switch와 단락 평가",
        body: "switch의 각 case에는 break가 필요합니다. 빠지면 다음 case로 흘러내립니다(fall-through). 의도한 fall-through는 주석으로 명시하는 것이 관례입니다. &&와 ||는 단락 평가됩니다. 왼쪽이 결과를 결정하면 오른쪽은 실행되지 않습니다 — 포인터 널 체크를 항상 앞쪽에 두는 이유입니다.",
        code: `switch (gear) {
case GEAR_P:
case GEAR_N:          /* P와 N 공통 처리 — 의도적 fall-through */
    allow_start = true;
    break;
case GEAR_D:
    allow_start = rpm_ok();
    break;
default:              /* 항상 default를 둔다 (MISRA 16.4) */
    allow_start = false;
    break;
}

if (msg != NULL && msg->len > 0u) {   /* NULL이면 뒤는 실행되지 않음 */
    process(msg);
}`,
        caption: "default는 예상 못한 값의 안전망입니다.",
      },
    ],
    keyPoints: [
      "if (x = v)는 할당이다. 비교는 ==를 쓰고 정적 분석으로 검출한다.",
      "정수 나눗셈은 버림. 스케일링은 곱셈을 앞에 두고, 제수 0을 검사한다.",
      "switch에는 default를 두고, 의도한 fall-through는 주석으로 표시한다.",
      "단락 평가 덕분에 NULL 체크를 && 앞에 둘 수 있다.",
    ],
  },
  {
    id: "basics-03",
    trackId: "basics",
    title: "함수와 컴파일 단위",
    minutes: 25,
    level: "입문",
    summary:
      "헤더 파일, 프로토타입, static 링크 범위, 헤더 가드. 수백 개 모듈로 나뉜 자동차 코드베이스를 지탱하는 C의 모듈 구조를 배웁니다.",
    sections: [
      {
        heading: "헤더와 프로토타입",
        body: "C는 사용 전에 선언이 있어야 합니다. 헤더 파일(.h)은 모듈의 공개 인터페이스를 선언하고, 구현 파일(.c)은 정의를 담습니다. 헤더 가드(#ifndef)는 같은 헤더가 한 컴파일 단위에 두 번 포함되는 것을 막습니다.",
        code: `/* led.h — 공개 인터페이스 */
#ifndef LED_H
#define LED_H

#include <stdbool.h>
#include <stdint.h>

void Led_Init(void);
void Led_Set(uint8_t index, bool on);

#endif /* LED_H */

/* led.c — 구현 */
#include "led.h"

void Led_Init(void) { /* ... */ }
void Led_Set(uint8_t index, bool on) { /* ... */ }`,
        caption: "모듈 사용자는 헤더만 봅니다. 구현은 .c 안에 숨깁니다.",
      },
      {
        heading: "static으로 내부 구현 숨기기",
        body: "파일 스코프에서 static이 붙은 함수와 전역 변수는 그 .c 파일 안에서만 보입니다. 전역 네임스페이스 오염을 막는 가장 기본적인 캡슐화 수단이며, AUTOSAR 생성 코드에서도 모듈 내부 helper는 static으로 선언됩니다. MISRA C Rule 8.7은 한 번역 단위에서만 쓰이는 객체에 static을 권고합니다.",
        code: `/* led.c */
#include "led.h"

static uint8_t led_state[4];        /* led.c 밖에서 접근 불가 */

static void write_port(uint8_t v)   /* 내부 helper */
{
    GPIO_ODR = (GPIO_ODR & 0xF0u) | v;
}

void Led_Set(uint8_t index, bool on) {
    if (index < 4u) {
        led_state[index] = on ? 1u : 0u;
        write_port(pack_bits(led_state));
    }
}`,
        caption: "static은 C의 private입니다.",
      },
      {
        heading: "번역 단위와 링크",
        body: "컴파일러는 각 .c 파일을 전처리기 통과 후 하나의 번역 단위(TU)로 컴파일하고, 링커가 오브젝트들을 연결합니다. 정의는 전체 프로그램에서 한 번이어야 합니다(ODR). 헤더에 전역 변수 정의를 쓰면 여러 TU에서 중복 정의 링크 에러가 납니다 — 헤더에는 extern 선언만 두세요.",
        code: `/* config.h */
extern uint16_t g_target_rpm;   /* 선언: "어딘가에 있다" */

/* config.c */
uint16_t g_target_rpm = 3000u;  /* 정의: 딱 한 번만 */`,
        caption: "선언과 정의의 구분이 링크 에러를 예방합니다.",
      },
    ],
    keyPoints: [
      "헤더 = 공개 인터페이스 선언, .c = 구현. 헤더 가드는 필수.",
      "static(파일 스코프)은 C의 캡슐화 수단이다.",
      "전역 변수 정의는 .c에 한 번, 헤더에는 extern 선언만.",
      "모듈 함수 이름에 모듈 접두어(Led_, Can_)를 붙이는 것이 자동차 업계 관례다.",
    ],
  },

  // ─────────────────────── TRK-02 포인터와 메모리 ───────────────────────
  {
    id: "memory-01",
    trackId: "memory",
    title: "포인터와 주소",
    minutes: 30,
    level: "중급",
    summary:
      "&와 *, 포인터 산술, const 포인터. 메모리 맵드 하드웨어를 다루기 전에 반드시 통과해야 하는 관문입니다.",
    sections: [
      {
        heading: "포인터는 주소를 담는 변수다",
        body: "포인터의 타입은 가리키는 대상의 타입입니다. 역참조 *p는 그 주소에 저장된 값에 접근하는 연산입니다. ECU 코드에서 포인터는 하드웨어 레지스터, DMA 버퍼, 콜백 컨텍스트를 가리키는 데 쓰입니다.",
        code: `uint16_t voltage = 3300u;   /* 3.3V (mV 단위) */
uint16_t *p = &voltage;     /* p는 voltage의 주소를 보관 */

*p = 5000u;                 /* voltage가 5000으로 바뀜 */

void *raw = p;              /* void* — 타입 없는 범용 포인터 */
uint16_t *q = (uint16_t *)raw;  /* 반드시 원래 타입으로 캐스팅 */`,
        caption: "void*는 전달은 하되, 사용 시점에 타입을 복원합니다.",
      },
      {
        heading: "포인터 산술은 타입 크기 단위",
        body: "p + 1은 주소 값에 1을 더하는 것이 아니라 sizeof(*p) 바이트만큼 이동합니다. uint32_t 배열에서 p+1은 4바이트 뒤입니다. 이 규칙 덕분에 배열 인덱싱 arr[i]는 *(arr + i)와 정확히 같습니다.",
        code: `uint32_t buffer[8];
uint32_t *cur = &buffer[2];

cur++;                  /* &buffer[3] — 4바이트 전진 */
cur[1] = 0xA5A5A5A5u;   /* buffer[4]에 기록 */

/* arr[i] == *(arr + i) */
for (uint8_t i = 0u; i < 8u; i++) {
    buffer[i] = 0u;
}`,
        caption: "포인터 산술의 단위는 요소의 크기입니다.",
      },
      {
        heading: "const 포인터 구분하기",
        body: "const uint16_t *p는 가리키는 값을 못 바꾸는 포인터, uint16_t *const p는 자신이 다른 곳을 못 가리키는 포인터입니다. 하드웨어 레지스터처럼 값은 읽되 주소는 고정인 경우 후자를 씁니다. 읽기 전용 데이터를 가리킬 때는 항상 const를 붙여야 컴파일러가 최적화와 오류 검출을 돕습니다.",
        code: `const uint16_t *cal;      /* 값 수정 불가, 재지정 가능 */
uint16_t *const port = (uint16_t *const)0x40021014u;
                          /* 주소 고정, 값은 씀 — 출력 포트 */

void Print(const char *s) {   /* 인자로 받은 문자열을 안 바꾼다는 약속 */
    while (*s != '\\0') { putc(*s++); }
}`,
        caption: "const의 위치가 무엇을 묶는지 결정합니다.",
      },
    ],
    keyPoints: [
      "포인터 타입 = 가리키는 대상의 타입. 역참조는 그 타입으로 해석한다.",
      "포인터 산술은 sizeof(대상) 바이트 단위로 이동한다.",
      "arr[i]와 *(arr + i)는 같은 식이다.",
      "const T *p(값 보호)와 T *const p(주소 고정)를 구분한다.",
    ],
  },
  {
    id: "memory-02",
    trackId: "memory",
    title: "배열, 문자열, 구조체",
    minutes: 30,
    level: "중급",
    summary:
      "배열과 포인터의 관계, 구조체 패딩과 정렬, -> 연산자. CAN 프레임 구조체 설계까지 이어지는 실무 지식입니다.",
    sections: [
      {
        heading: "배열은 포인터로 붕괴한다",
        body: "배열 이름은 대부분의 표현식에서 첫 요소의 포인터로 변환됩니다. 그래서 sizeof(arr)만 예외적으로 전체 크기를 줍니다. 함수 인자로 받은 int arr[]는 실제로는 포인터이므로 함수 안에서는 길이를 알 수 없습니다 — 길이 인자를 항상 같이 넘기는 것이 임베디드 API의 기본 형식입니다.",
        code: `uint8_t frame[8];

uint8_t *p = frame;         /* 배열 → 포인터 붕괴 */
sizeof(frame);              /* 8 — sizeof에서만 배열 그 자체 */

void Sum(const uint32_t *arr, uint8_t len) {  /* 길이 인자 필수 */
    uint32_t total = 0u;
    for (uint8_t i = 0u; i < len; i++) { total += arr[i]; }
}`,
        caption: "API 설계: 포인터 + 길이는 한 쌍입니다.",
      },
      {
        heading: "구조체와 패딩",
        body: "구조체 멤버는 정렬 요구사항 때문에 사이에 패딩이 들어갈 수 있습니다. char + int + char 구조체는 6바이트가 아니라 보통 12바이트입니다. CAN 메시지가 오가는 공유 메모리나 프로토콜 버퍼에서는 컴파일러마다 배치가 달라지면 치명적이므로, 멤버 순서를 크기 내림차순으로 배치하거나 패킹 속성을 명시적으로 관리합니다.",
        code: `typedef struct {
    uint32_t id;        /* 4B */
    uint32_t timestamp; /* 4B */
    uint16_t rpm;       /* 2B */
    uint8_t  len;       /* 1B + 1B 패딩 */
} CanFrame_t;           /* sizeof = 12 (배치는 컴파일러 의존) */

CanFrame_t frame;
CanFrame_t *fp = &frame;

fp->rpm = 2500u;        /* (*fp).rpm 과 동일 */
frame.len = 8u;         /* . 연산자도 여전히 유효 */`,
        caption: "->는 포인터용, .은 객체용.",
      },
      {
        heading: "문자열은 char 배열일 뿐",
        body: "C 문자열은 '\\0'로 끝나는 문자 배열입니다. char s[] = \"CAN\"은 수정 가능한 배열을 만들고, char *s = \"CAN\"은 보통 읽기 전용 메모리의 리터럴을 가리킵니다. 후자를 수정하면 UB입니다. 임베디드에서는 strcpy보다 길이 제한이 있는 strncpy, 혹은 사본이 필요 없는 고정 길이 버퍼 설계를 선호합니다.",
        code: `char name_a[] = "CAN";   /* 배열 — 수정 가능 */
char *name_b  = "CAN";   /* 포인터 — 리터럴 수정 시 UB */

name_a[0] = 'X';         /* OK */
name_b[0] = 'X';         /* 위험! 읽기 전용 영역일 수 있음 */

char ecu_id[8];
strncpy(ecu_id, "ECU_A1", sizeof(ecu_id) - 1u);
ecu_id[sizeof(ecu_id) - 1u] = '\\0';   /* 종단 보장 */`,
        caption: "버퍼 오버플로 방지: 항상 길이 제한과 종단 문자.",
      },
    ],
    keyPoints: [
      "배열은 표현식에서 포인터로 붕괴한다. sizeof만 예외.",
      "함수 인자 배열은 포인터이므로 길이 인자를 반드시 함께 전달한다.",
      "구조체에는 패딩이 생긴다. 멤버 순서와 직렬화 배치를 의식한다.",
      "문자열 리터럴을 가리키는 포인터의 대상은 수정하지 않는다.",
    ],
  },
  {
    id: "memory-03",
    trackId: "memory",
    title: "메모리 구조와 동적 할당",
    minutes: 30,
    level: "중급",
    summary:
      ".text/.data/.bss/스택/힙. 안전 크리티컬 자동차 소프트웨어가 malloc을 금지하는 이유를 메모리 구조 관점에서 설명합니다.",
    sections: [
      {
        heading: "펌웨어의 메모리 지도",
        body: "MCU의 실행 이미지는 섹션으로 구성됩니다. 코드와 상수는 플래시에, 전역 변수는 RAM에 배치됩니다. 초기화되지 않은 전역 변수는 .bss에 모여 스타트업 코드에서 한 번에 0으로 채워집니다. 스택은 함수 호출과 지역 변수에, 힙은 malloc 영역으로 사용됩니다.",
        code: `/* 링크 스크립트 개념도 */
FLASH:  .text   — 실행 코드
        .rodata — const 상수 (캘리브레이션 테이블 등)

RAM:    .data   — 초기값 있는 전역/static (부팅 시 플래시에서 복사)
        .bss    — 초기값 없는 전역/static (부팅 시 0 클리어)
        STACK   — 지역 변수, 리턴 주소 (LIFO)
        HEAP    — malloc() 영역 (자동차 SW에서는 보통 비워 둠)`,
        caption: "map 파일에서 이 배치와 크기를 직접 확인할 수 있습니다.",
      },
      {
        heading: "malloc이 위험한 이유",
        body: "동적 할당은 실행 시점에 메모리를 찾으므로 응답 시간이 비결정적이고, 반복 사용 시 단편화가 생기며, 메모리가 부족하면 NULL을 돌려줍니다. 실시간성과 수명 전체의 안정성을 증명해야 하는 자동차 ECU에서는 이런 불확실성을 허용할 수 없습니다. 그래서 MISRA C Rule 21.3은 malloc/free 사용을 금지합니다.",
        code: `uint32_t *buf = malloc(10u * sizeof(uint32_t));
if (buf == NULL) {          /* 항상 실패를 검사하지만 — */
    /* 여기서 뭘 할 수 있는가? 주행 중이라면? */
}
free(buf);
buf = NULL;                 /* dangling pointer 방지 습관 */`,
        caption: "실패 처리를 정의할 수 없다면, 그 할당은 하지 않아야 합니다.",
      },
      {
        heading: "정적 할당 대안",
        body: "자동차 C 코드는 필요한 메모리를 컴파일 타임에 확정합니다. 정적 버퍼, 풀(pool) 할당기, 링 버퍼가 대표적입니다. 메모리 풀은 고정 크기 블록을 미리 잘라 두어 할당은 O(1), 단편화 없음, 실패 시의 동작도 명확합니다.",
        code: `static uint8_t rx_buffer[64];     /* 정적 버퍼 */

/* 고정 크기 블록 풀 — malloc의 결정적 대안 */
#define POOL_BLOCKS 8u
static uint8_t  pool_mem[POOL_BLOCKS][32];
static bool     pool_used[POOL_BLOCKS];

void *Pool_Alloc(void) {
    for (uint8_t i = 0u; i < POOL_BLOCKS; i++) {
        if (!pool_used[i]) { pool_used[i] = true; return pool_mem[i]; }
    }
    return NULL;                /* 실패 의미가 명확함 */
}`,
        caption: "블록 크기가 고정되면 할당/해제가 단순하고 증명 가능해집니다.",
      },
    ],
    keyPoints: [
      ".text/.rodata는 플래시, .data/.bss는 RAM. 스타트업 코드가 초기화한다.",
      "malloc은 비결정적 응답 시간, 단편화, 고갈 위험 때문에 자동차에서 금지된다 (MISRA 21.3).",
      "정적 버퍼와 메모리 풀로 대체한다. 할당 실패 시 동작이 정의 가능해야 한다.",
      "free 후 포인터는 NULL로 만든다.",
    ],
  },

  // ─────────────────────── TRK-03 비트 조작과 레지스터 ───────────────────────
  {
    id: "bits-01",
    trackId: "bits",
    title: "비트 연산자",
    minutes: 20,
    level: "중급",
    summary:
      "AND, OR, XOR, NOT, 시프트. ECU 레지스터와 CAN 신호를 다루는 최소 어휘를 손에 넣습니다.",
    sections: [
      {
        heading: "여섯 개의 연산자",
        body: "비트 연산은 0과 1의 진리표를 그대로 구현합니다. AND는 추출, OR은 설정, XOR은 반전·비교, NOT은 전체 반전, 시프트는 곱/나눗셈과 자리 이동에 씁니다. 16진수로 쓰면 4비트씩 묶여 읽히므로 레지스터 값은 항상 0x 표기로 다룹니다.",
        code: `uint8_t a = 0xA5u;   /* 1010 0101 */
uint8_t b = 0x3Cu;   /* 0011 1100 */

a & b;   /* 0x24 = 0010 0101 & 0011 1100 → 0010 0100 */
a | b;   /* 0xBD                              */
a ^ b;   /* 0x99 — 서로 다른 비트만 1          */
~a;      /* 0x5A — 전체 반전                  */
a << 2;  /* 0x94 — ×4, 상위 비트는 잘림        */
a >> 4;  /* 0x0A — ÷16                        */`,
        caption: "진리표를 암기보다 손으로 한 번 그려 보세요.",
      },
      {
        heading: "시프트의 주의점",
        body: "부호 있는 타입의 우측 시프트는 구현 정의입니다(산술 시프트일 수도, 논리 시프트일 수도). 그래서 시프트는 항상 unsigned 타입으로 합니다. 피연산자 타입보다 크게 시프트하면 UB입니다 — 32비트 값에 1 << 31은 int 범위 문제 때문에 (1u << 31)이나 (1UL << 31)로 써야 합니다.",
        code: `uint8_t  x8  = 1u;
x8 << 8;              /* UB 아님 — int로 승격되어 0x100 */

uint32_t flag = (1u << 31);      /* OK */
uint32_t bad  = (1 << 31);       /* 위험: int 오버플로 UB */

int16_t s = -8;
s >> 1;               /* 구현 정의! -4일 수도, 다른 값일 수도 */
(uint16_t)s >> 1;     /* 논리 시프트 — 결과가 확정 */`,
        caption: "시프트 = unsigned + u 접미사가 안전 규칙입니다.",
      },
      {
        heading: "실전: CAN 신호 추출",
        body: "CAN 데이터 바이트에서 신호를 꺼내는 작업은 시프트와 마스크의 조합입니다. 엔지니어가 비트 단위 신호 배치를 읽을 수 있어야 드라이버 코드를 검증할 수 있습니다.",
        code: `/* 바이트 2~3에 big-endian으로 담긴 12비트 속도 신호 */
uint8_t data[8];                 /* CAN 페이로드 */

uint16_t speed_raw =
    (uint16_t)(((uint16_t)data[2] << 8) | data[3]) >> 4;
/* 12비트 추출 */
uint16_t speed_kph = (uint16_t)(speed_raw * 25u / 100u);
/* 물리값 변환: raw * factor */`,
        caption: "DBC 파일의 신호 정의가 바로 이 코드로 번역됩니다.",
      },
    ],
    keyPoints: [
      "AND 추출, OR 설정, XOR 토글/비교, 시프트는 자리 이동.",
      "시프트는 unsigned 타입으로. signed 우측 시프트는 구현 정의다.",
      "1 << 31 같은 식은 (1u << 31)로 써야 UB를 피한다.",
      "레지스터 값과 신호 배치는 16진수로 읽고 쓴다.",
    ],
  },
  {
    id: "bits-02",
    trackId: "bits",
    title: "비트 설정·클리어·토글",
    minutes: 20,
    level: "중급",
    summary:
      "REG |= (1u << n) 일가의 관용구. 다른 비트는 건드리지 않고 원하는 비트만 조작하는 마스킹 기술을 완성합니다.",
    sections: [
      {
        heading: "네 가지 관용구",
        body: "특정 비트를 1로 만들려면 해당 비트만 1인 마스크로 OR, 0으로 만들려면 반전 마스크로 AND, 뒤집으려면 XOR, 읽으려면 시프트 후 1과 AND합니다. 이 네 문장은 임베디드 C 코드의 알파벳입니다.",
        code: `#define LED_PIN  (1u << 3)      /* 비트 3 마스크 */

GPIO_ODR |=  LED_PIN;           /* SET   — 비트 3만 1로 */
GPIO_ODR &= ~LED_PIN;           /* CLEAR — 비트 3만 0으로 */
GPIO_ODR ^=  LED_PIN;           /* TOGGLE */

uint8_t on = (uint8_t)((GPIO_IDR >> 3) & 1u);   /* READ */`,
        caption: "|=, &=~, ^=, >> & 1u — 네 문장을 외우세요.",
      },
      {
        heading: "여러 비트를 한 번에",
        body: "마스크를 조합하면 여러 비트를 동시에 다룰 수 있습니다. 2~3비트 필드는 먼저 그 자리만 0으로 지운 뒤 새 값을 밀어 넣습니다. 이 패턴은 클럭 설정 레지스터, GPIO 모드 필드에서 매일 쓰입니다.",
        code: `#define MODE_POS   4u
#define MODE_MASK  (0x3u << MODE_POS)   /* 비트 5:4 두 칸 */

void SetMode(uint8_t mode) {
    uint32_t reg = GPIO_CFGR;
    reg &= ~MODE_MASK;                  /* 필드 클리어 */
    reg |= ((uint32_t)mode << MODE_POS) & MODE_MASK;
    GPIO_CFGR = reg;                    /* 한 번에 기록 */
}`,
        caption: "필드 갱신 = 지우고(shift & mask), 채우기.",
      },
      {
        heading: "read-modify-write와 원자성",
        body: "|=는 실제로 읽기→수정→쓰기의 세 단계입니다. 인터럽트가 중간에 같은 레지스터를 건드리면 갱신이 유실될 수 있습니다. 이것이 뒤에서 배울 임계 구역(critical section)의 동기입니다. 지금은 이 문장이 단일 연산이 아니라는 점만 기억하세요.",
        code: `/* reg |= MASK 는 실제로: */
tmp = reg;        /* 1) 읽기 */
tmp = tmp | MASK; /* 2) 수정 */
reg = tmp;        /* 3) 쓰기 — 여기 끼어드는 인터럽트? */`,
        caption: "임베디드 동시성의 첫 번째 복선입니다.",
      },
    ],
    keyPoints: [
      "SET: |=, CLEAR: &= ~, TOGGLE: ^=, READ: >> n & 1u.",
      "멀티 비트 필드는 클리어 후 시프트한 값을 OR로 채운다.",
      "read-modify-write는 원자 연산이 아니다. ISR과 공유 시 보호가 필요하다.",
      "마스크 정의는 매직 넘버 대신 #define으로 문서화한다.",
    ],
  },
  {
    id: "bits-03",
    trackId: "bits",
    title: "레지스터 맵과 하드웨어 접근",
    minutes: 25,
    level: "심화",
    summary:
      "메모리 맵드 I/O. 주소 상수를 volatile 포인터로 캐스팅해 실제 하드웨어 레지스터를 읽고 쓰는 방법을 배웁니다.",
    sections: [
      {
        heading: "레지스터는 주소가 정해진 메모리다",
        body: "MCU의 주변장치 레지스터는 메모리 주소 공간에 배치됩니다. 데이터시트의 레지스터 맵은 베이스 주소 + 오프셋 표입니다. C에서는 그 주소에 volatile 포인터를 씌워 접근합니다. 이 원리가 드라이버 코드의 전부라고 해도 과언이 아닙니다.",
        code: `#define GPIOA_BASE  0x40020000u
#define GPIOA_MODER (*(volatile uint32_t *)(GPIOA_BASE + 0x00u))
#define GPIOA_OTYPER(*(volatile uint32_t *)(GPIOA_BASE + 0x04u))
#define GPIOA_ODR   (*(volatile uint32_t *)(GPIOA_BASE + 0x14u))

void Led_On(uint8_t pin) {
    GPIOA_MODER |= (1u << (2u * pin));  /* 출력 모드 */
    GPIOA_ODR   |= (1u << pin);         /* High 출력 */
}`,
        caption: "주소 상수 → volatile 포인터 → 역참조. 3단 공식입니다.",
      },
      {
        heading: "구조체로 레지스터 맵 모델링",
        body: "레지스터들이 연속 배치라면 구조체 포인터로 통째로 매핑하는 편이 깔끔합니다. CMSIS 헤더가 이 방식으로 GPIO_TypeDef 같은 타입을 제공합니다. 패딩이 없도록 레지스터 순서·크기를 데이터시트와 맞춰야 하므로, 보통은 벤더가 제공한 헤더를 씁니다.",
        code: `typedef struct {
    volatile uint32_t MODER;   /* +0x00 */
    volatile uint32_t OTYPER;  /* +0x04 */
    volatile uint32_t OSPEEDR; /* +0x08 */
    volatile uint32_t PUPDR;   /* +0x0C */
    volatile uint32_t IDR;     /* +0x10 */
    volatile uint32_t ODR;     /* +0x14 */
} GPIO_TypeDef;

#define GPIOA  ((GPIO_TypeDef *)0x40020000u)

GPIOA->ODR |= (1u << 5);   /* PA5 High */`,
        caption: "CMSIS 스타일 — 벤더 헤더의 내부 구조를 이해하면 디버깅이 빨라집니다.",
      },
      {
        heading: "volatile이 붙는 이유",
        body: "레지스터는 코드 밖(하드웨어)에서 언제든 값이 바뀝니다. 컴파일러는 이를 모르므로, volatile이 없으면 읽기를 상수로 대체하거나 죽은 쓰기를 지울 수 있습니다. 자세한 메커니즘은 임베디드 트랙의 volatile 강의에서 이어집니다.",
        code: `/* volatile이 없다면 컴파일러는 이렇게 생각해 버립니다 */
while ((GPIOA->IDR & 0x1u) == 0u) { }
/* "IDR은 아까 읽었으니 0이야. 무한 루프네?" → 하드웨어 무시 */`,
        caption: "volatile은 '이 값은 네가 모르는 사이에 바뀐다'는 선언입니다.",
      },
    ],
    keyPoints: [
      "주변장치 레지스터 = 메모리 주소. 베이스 + 오프셋으로 접근한다.",
      "접근 공식: *(volatile uint32_t *)(주소) 또는 volatile 구조체 포인터.",
      "레지스터는 코드 외부에서 변하므로 volatile이 필수다.",
      "실무에서는 벤더 제공 헤더(CMSIS 등)를 쓰고, 그 구조를 이해한다.",
    ],
  },

  // ─────────────────────── TRK-04 임베디드 핵심 패턴 ───────────────────────
  {
    id: "embedded-01",
    trackId: "embedded",
    title: "volatile과 컴파일러 최적화",
    minutes: 25,
    level: "심화",
    summary:
      "임베디드 면접 필수 질문 1순위. 컴파일러가 내 코드를 어떻게 '지워 버리는지', volatile이 막는 것이 무엇인지 정확히 배웁니다.",
    sections: [
      {
        heading: "최적화는 눈에 보이지 않는 변수를 지운다",
        body: "컴파일러는 '값이 변하지 않는' 변수의 읽기를 캐시하거나 제거합니다. 인터럽트가 바꾸는 플래그를 일반 변수로 선언하면, 메인 루프의 검사 코드가 최적화로 사라져 프로그램이 멈춥니다. volatile은 '이 객체는 프로그램 외부에서 변할 수 있으니 매번 실제로 읽고 써라'는 지시입니다.",
        code: `static bool msg_ready = false;   /* volatile 없음 */

void CAN_RX_IRQHandler(void) {
    msg_ready = true;            /* ISR이 변경 */
}

int main(void) {
    while (!msg_ready) {         /* 컴파일러: "false로 고정" */
    }                            /* → 영원히 빠져나가지 못할 수 있음 */
}`,
        caption: "-O2에서 실제로 관찰되는 증상입니다.",
      },
      {
        heading: "volatile이 필요한 세 가지 상황",
        body: "(1) 메모리 맵드 하드웨어 레지스터, (2) ISR과 공유하는 전역 변수, (3) 멀티스레드/RTOS 태스크 공유 변수(단, 원자성과 순서는 별도의 동기화 기법이 필요). volatile은 원자성을 주지 않고 메모리 배리어도 아닙니다 — 그저 컴파일러의 캐싱/재배치를 막을 뿐입니다.",
        code: `volatile bool g_msg_ready = false;

void CAN_RX_IRQHandler(void) {
    g_msg_ready = true;
}

int main(void) {
    while (!g_msg_ready) {      /* 매 반복 실제로 메모리에서 읽음 */
    }
    process_message();
    g_msg_ready = false;
}`,
        caption: "플래그에 volatile을 붙이면 루프가 의도대로 돕니다.",
      },
      {
        heading: "const volatile과 포인터 수식",
        body: "const volatile은 '코드는 쓰지 않지만 외부에서 변하는' 대상, 예를 들어 읽기 전용 상태 레지스터에 씁니다. 포인터 수식 위치에도 주의하세요. volatile uint32_t *p는 대상이 volatile, uint32_t *volatile p는 포인터 자신이 volatile입니다.",
        code: `const volatile uint32_t *STATUS =
    (const volatile uint32_t *)0x40013000u;

uint32_t s = *STATUS;   /* 읽기 허용, 쓰기 금지 */
*STATUS = 0u;           /* 컴파일 에러 */`,
        caption: "하드웨어가 쓰는 값, 소프트웨어는 읽기만 — const volatile.",
      },
    ],
    keyPoints: [
      "volatile 대상: HW 레지스터, ISR 공유 변수, 태스크 공유 변수.",
      "volatile은 컴파일러 최적화(캐싱·제거)를 막는다. 원자성은 주지 않는다.",
      "ISR과 메인 간 데이터 교환은 volatile 플래그 + 임계 구역이 기본 패턴.",
      "const volatile = 읽기 전용이지만 하드웨어가 갱신하는 레지스터.",
    ],
  },
  {
    id: "embedded-02",
    trackId: "embedded",
    title: "인터럽트와 임계 구역",
    minutes: 30,
    level: "심화",
    summary:
      "ISR 작성 규칙, read-modify-write 경쟁, 인터럽트 금지 임계 구역. 실시간 시스템의 기초 체력을 만듭니다.",
    sections: [
      {
        heading: "ISR의 규칙",
        body: "인터럽트 핸들러는 다른 모든 일을 멈추고 실행됩니다. 그래서 짧고 빨라야 하며, 블록되는 호출(printf, 지연, OS 대기)을 해서는 안 됩니다. ISR이 길어지면 다른 인터럽트의 응답이 늦어지고 실시간 데드라인이 깨집니다. 무거운 일은 플래그만 남기고 메인 루프나 태스크에 넘깁니다.",
        code: `void EXTI0_IRQHandler(void) {
    /* 좋음: 플래그 세팅만 */
    g_button_event = true;
    EXTI->PR = 0x1u;      /* 인터럽트 원인 지우기 (종료 필수 동작) */
}

/* 나쁨: ISR에서 printf, 지연, OS API 호출 → 금지 */`,
        caption: "ISR은 '통보'만 하고, '처리'는 넘깁니다.",
      },
      {
        heading: "경쟁 조건: read-modify-write",
        body: "ISR과 메인이 같은 변수를 갱신하면 문제가 생깁니다. 메인에서 tick_count++을 실행하는 동안 인터럽트가 끼어들어 같은 변수를 증가시키면 한 번의 증가가 사라집니다. 멀티바이트 값의 읽기도 중간에 잘릴 수 있습니다.",
        code: `volatile uint32_t tick_count;

void SysTick_Handler(void) {
    tick_count++;          /* 읽기-수정-쓰기 */
}

uint32_t snapshot = tick_count;   /* 메인 쪽도 읽기-수정-쓰기를 한다면? */
/* 메인 증가 도중 ISR 발생 → 증가 1회 유실 */`,
        caption: "같은 변수를 양쪽에서 갱신하면 반드시 보호가 필요합니다.",
      },
      {
        heading: "임계 구역으로 보호하기",
        body: "가장 단순한 동기화는 공유 데이터 접근 동안 해당 인터럽트를 잠시 금지하는 것입니다. 이것을 임계 구역(critical section)이라고 합니다. 진입/탈출을 최소 범위로 두는 것이 실시간성 유지의 핵심입니다. AUTOSAR OS에서는 GetResource/SuspendInterrupts, 또는 SchM 계층이 이 패턴을 표준화합니다.",
        code: `uint32_t GetTick_Safe(void) {
    __disable_irq();                 /* 임계 구역 진입 */
    uint32_t snap = tick_count;      /* 보호되는 읽기 */
    __enable_irq();                  /* 즉시 복귀 */
    return snap;
}

/* 멀티바이트 갱신도 같은 방식으로 감싼다 */`,
        caption: "임계 구역은 짧게. 중첩 시 상태 저장/복원 순서를 지키세요.",
      },
    ],
    keyPoints: [
      "ISR은 짧게. 블록 호출 금지, 실제 처리는 플래그로 위임.",
      "ISR과 공유하는 변수는 volatile + 임계 구역으로 보호.",
      "read-modify-write와 멀티바이트 읽기는 끼어들기에 취약하다.",
      "임계 구역은 최소 범위로. AUTOSAR에서는 SchM/RTE가 이 패턴을 담당.",
    ],
  },
  {
    id: "embedded-03",
    trackId: "embedded",
    title: "함수 포인터와 상태 머신",
    minutes: 30,
    level: "심화",
    summary:
      "콜백, 이벤트 디스패치, 테이블 기반 상태 머신. 드라이버와 AUTOSAR 런너블 구조의 뼈대가 되는 패턴입니다.",
    sections: [
      {
        heading: "함수 포인터 문법",
        body: "함수 포인터는 '함수를 담는 변수'입니다. 선언이 복잡해 typedef로 별칭을 붙이는 것이 관례입니다. 하드웨어 추상화에서 상위 계층은 구체 함수 대신 함수 포인터를 받아 구현과 분리됩니다.",
        code: `/* void를 반환하고 uint8_t 인자 하나를 받는 함수의 포인터 */
typedef void (*Callback_t)(uint8_t data);

void OnButton(uint8_t data) { /* ... */ }

Callback_t cb = OnButton;
cb(0x01u);                /* OnButton(0x01u) 호출 */
(*cb)(0x01u);             /* 같은 호출 — 오래된 표기 */`,
        caption: "typedef로 시그니처를 문서화하세요.",
      },
      {
        heading: "콜백과 이벤트 디스패치",
        body: "이벤트 ID별로 콜백을 등록해 두면, 디스패처가 이벤트에 맞는 함수를 호출합니다. 하드웨어가 바뀌어도 콜백 교체만으로 대응할 수 있습니다. 자동차 SW에서 ECU 설정(Config)이 코드와 분리되는 방식의 축소판입니다.",
        code: `#define EV_COUNT 4u
static Callback_t handlers[EV_COUNT];

void Event_Subscribe(uint8_t ev, Callback_t cb) {
    if (ev < EV_COUNT) { handlers[ev] = cb; }
}

void Event_Dispatch(uint8_t ev, uint8_t data) {
    if ((ev < EV_COUNT) && (handlers[ev] != NULL)) {
        handlers[ev](data);
    }
}`,
        caption: "NULL 검사 후 호출 — 함수 포인터 사용의 기본 예의.",
      },
      {
        heading: "스위치 기반 상태 머신",
        body: "임베디드 제어 로직의 표준 구조는 상태 머신입니다. 상태와 이벤트를 열거형으로 정의하고, 매 주기(step)마다 현재 상태와 이벤트를 보고 다음 상태로 전이합니다. 10ms 주기 태스크에서 도는 App_Step() 같은 함수가 바로 이것이며, AUTOSAR 런너블의 실체이기도 합니다.",
        code: `typedef enum { ST_IDLE, ST_RUN, ST_FAULT } State_t;
typedef enum { EV_NONE, EV_START, EV_STOP, EV_ERR } Event_t;

void App_Step(Event_t ev) {
    static State_t state = ST_IDLE;

    switch (state) {
    case ST_IDLE:
        if (ev == EV_START) { state = ST_RUN; }
        break;
    case ST_RUN:
        if (ev == EV_ERR)   { state = ST_FAULT; }
        if (ev == EV_STOP)  { state = ST_IDLE; }
        break;
    case ST_FAULT:
        Reset_Fault();
        state = ST_IDLE;
        break;
    default:
        state = ST_IDLE;
        break;
    }
}`,
        caption: "상태 × 이벤트 표(전이 테이블)를 먼저 그리고 코드로 옮기세요.",
      },
    ],
    keyPoints: [
      "함수 포인터 선언은 typedef로 관리한다.",
      "콜백 호출 전 NULL 검사는 필수.",
      "상태 머신 = (상태, 이벤트) → (다음 상태, 동작). 전이 테이블로 설계한다.",
      "주기적으로 도는 Step 함수가 ECU 제어 로직의 기본 단위다.",
    ],
  },

  // ─────────────────────── TRK-05 자동차 코딩 표준 ───────────────────────
  {
    id: "automotive-01",
    trackId: "automotive",
    title: "MISRA C 핵심 규칙",
    minutes: 25,
    level: "심화",
    summary:
      "자동차·안전 크리티컬 C 코드의 사실상 표준. 규칙 체계와 실무에서 가장 자주 만나는 규칙들을 배웁니다.",
    sections: [
      {
        heading: "MISRA C가 존재하는 이유",
        body: "C는 강력하지만 UB와 구현 정의 동작이 많아 같은 코드가 환경마다 다르게 동작할 수 있습니다. MISRA C는 사고를 일으킬 수 있는 언어 기능을 제한하는 규칙집입니다. 규칙은 필수(Required/Mandatory), 필요(Required), 권고(Advisory)로 등급이 나뉘며, 프로젝트는 편차(deviation) 절차를 통해 예외를 문서화합니다.",
        code: `/* MISRA C:2012 규칙 등급 */
Mandatory  — 반드시 준수 (편차 불가)
Required   — 준수 또는 문서화된 편차
Advisory   — 권고 (좋은 습관)

/* 검사 도구: Polyspace, PC-lint, QA-C,
   그리고 GCC/Clang의 -Wall -Wextra + 정적 분석 */`,
        caption: "면접에서 '왜 MISRA를 쓰는가'에 UB/이식성/심사 대응을 답하세요.",
      },
      {
        heading: "실무 단골 규칙 7가지",
        body: "코딩 테스트와 리뷰에서 반복적으로 등장하는 규칙들입니다. 각 규칙이 막으려는 실패 시나리오를 함께 기억하세요.",
        code: `/* Rule 8.4  — 함수는 호환되는 선언과 정의를 가질 것 */
/* Rule 10.x — essential type: 부호/폭 혼용 연산 제한 */
uint8_t  u = 10u;
int16_t  s = u + 5;          /* 10.x 경고 — 명시적 캐스트 필요 */

/* Rule 13.4 — 할당 결과를 조건에 사용 금지 */
if ((x = f()) != 0) { }      /* 금지: 실수 유발 */

/* Rule 15.x — goto 금지, 함수당 단일 탈출 권고 */
/* Rule 16.x — switch에 default 필수 */
/* Rule 17.7 — non-void 함수의 반환값을 사용할 것 */
(void)memcpy(dst, src, n);   /* 일부 라이브러리: 의도적 무시 표기 */

/* Rule 21.3 — 동적 메모리 할당 금지 */
/* Rule 21.6 — stdio 입출력 금지 (printf 등) */`,
        caption: "규칙 번호보다 '왜 금지되는가'를 설명할 수 있어야 합니다.",
      },
      {
        heading: "편차와 도구 체인",
        body: "모든 규칙을 기계적으로 지키는 것은 불가능에 가깝습니다. 그래서 필수 규칙 위반은 심사 대상이 되고, 편차는 사유·영향 분석·승인자와 함께 기록됩니다. 지원 동기에는 'MISRA 준수 현황을 어떻게 관리하는가'라는 질문이 자주 나옵니다.",
        code: `/* 편차(deviation) 기록 예시 */
/*
 * MISRA C:2012 Rule 2.2 (dead code) 편차
 * 사유: 안전 로그용 진단 빌드 매크로
 * 영향: 릴리스 빌드에서만 컴파일됨, 동작 영향 없음
 * 승인: 기능안전 담당자 서명, JIRA FSW-1042
 */`,
        caption: "편차 관리 = 기능안전(ISO 26262) 심사 증거물입니다.",
      },
    ],
    keyPoints: [
      "MISRA C는 UB·구현 정의 동작·실수 유발 문법을 제한하는 규칙집이다.",
      "규칙 등급: Mandatory / Required / Advisory, 편차는 문서화한다.",
      "단골: 동적 할당 금지(21.3), stdio 금지(21.6), 반환값 사용(17.7), default 필수(16.x).",
      "정적 분석 도구로 자동 검사하는 것이 실무 표준이다.",
    ],
  },
  {
    id: "automotive-02",
    trackId: "automotive",
    title: "방어적 코딩과 정적 단언",
    minutes: 25,
    level: "심화",
    summary:
      "입력은 항상 의심하라. 범위 검증, 포화 연산, 정적 단언 — ECU 소프트웨어의 자존심인 견고함을 만드는 습관입니다.",
    sections: [
      {
        heading: "모든 경계에서 검증한다",
        body: "방어적 코딩은 외부 입력(센서, 통신, 캘리브레이션)뿐 아니라 함수 인자도 신뢰하지 않는 태도입니다. 배열 인덱스, 포인터, 나눗수의 제수를 사용하는 모든 지점에서 범위를 검사합니다. 잘못된 값은 조용히 무시하지 않고 안전하게 처리(기본값, 제한, 에러 보고)합니다.",
        code: `uint8_t Clamp_U8(int32_t value) {
    if (value < 0)   { return 0u; }
    if (value > 255) { return 255u; }
    return (uint8_t)value;
}

void Set_Speed(uint16_t speed) {
    if (speed > SPEED_MAX) {
        speed = SPEED_MAX;     /* 포화(saturation) */
    }
    Motor_Apply(speed);
}`,
        caption: "포화 연산은 제어 SW에서 가장 흔한 방어 기법입니다.",
      },
      {
        heading: "오버플로를 계산 전에 막는다",
        body: "고정폭 타입의 오버플로는 조용히 값을 감쌉니다(uint) — 결과가 틀린데도 아무 경보가 없습니다. 큰 곱셈은 승격을 이용하되 결과 범위를 검사하고, 누적값은 주기적으로 리셋하거나 포화시킵니다. 부호 혼합 연산은 명시적 캐스트로 의도를 남깁니다.",
        code: `/* 16비트 곱셈의 오버플로 */
uint16_t a = 400u, b = 300u;
uint16_t bad  = a * b;                  /* 120000 → 잘림 */
uint32_t good = (uint32_t)a * (uint32_t)b;  /* 120000 정상 */

/* 누적 전류 — 포화 */
uint16_t acc = current_sum + sample;
if (acc < current_sum) { acc = 0xFFFFu; }  /* 감지 시 포화 */
current_sum = acc;`,
        caption: "uint 오버플로는 정의되어 있지만, 논리는 깨집니다.",
      },
      {
        heading: "정적 단언으로 가정을 코드에 새긴다",
        body: "_Static_assert는 컴파일 타임에 가정을 검증합니다. 타입 크기, 테이블 크기, 열거형 개수 같은 불변식이 깨지면 빌드가 실패합니다. 실행 비용이 0인 검증이므로, 자동차 프로젝트에서는 런타임 assert와 함께 광범위하게 쓰입니다.",
        code: `_Static_assert(sizeof(uint32_t) == 4u,
               "플랫폼 타입 폭이 사양과 다릅니다");

#define MSG_COUNT 64u
_Static_assert((MSG_COUNT & (MSG_COUNT - 1u)) == 0u,
               "MSG_COUNT는 2의 거듭제곱이어야 합니다 (링 버퍼)");

uint8_t GetIndex(uint8_t i) {
    /* 런타임 방어 + 컴파일 타임 단언의 조합 */
    return (i < MSG_COUNT) ? i : 0u;
}`,
        caption: "가정을 주석이 아닌 단언으로 남기세요.",
      },
    ],
    keyPoints: [
      "함수 경계에서 인자 검증, 잘못된 값은 포화·기본값·에러 보고로 처리.",
      "uint 오버플로는 조용히 감싼다. 곱셈은 큰 타입으로 승격 후 범위 검사.",
      "_Static_assert로 불변식을 컴파일 타임에 검증한다.",
      "나눗수 0, 널 포인터, 배열 인덱스는 항상 사용 직전에 검사.",
    ],
  },
  {
    id: "automotive-03",
    trackId: "automotive",
    title: "AUTOSAR 아키텍처와 C 코드 관례",
    minutes: 30,
    level: "심화",
    summary:
      "BSW/RTE/ASW 3층 구조, 런너블, OS 태스크, 그리고 생성 코드의 명명 규칙. 독일 자동차 업계의 표준 아키텍처를 C 코드 관점에서 읽습니다.",
    sections: [
      {
        heading: "3층 아키텍처",
        body: "AUTOSAR는 애플리케이션(SW-C), 런타임 환경(RTE), 기본 소프트웨어(BSW)로 나뉩니다. 애플리케이션은 Rte_Read_/Rte_Write_ API로만 세상과 통신하고, 하드웨어 접근은 전부 BSW(Mcu, Port, Can, Com, OS...)가 책임집니다. 이 분리 덕분에 하드웨어가 바뀌어도 애플리케이션 로직은 재사용됩니다.",
        code: `/* ASW : 제어 로직 (Runnable)            */
/* RTE : 커넥터 — Rte_Read/Rte_Write      */
/* BSW : Can, Com, Os, Mcu, Port, Wdg ... */

void App_Control(void) {           /* 10ms 주기 런너블 */
    uint16_t rpm = 0u;
    Std_ReturnType ret;

    ret = Rte_Read_EngineRpm(&rpm);
    if (ret == RTE_E_OK) {
        if (rpm > 6000u) {
            (void)Rte_Write_LimiterReq(true);
        }
    }
}`,
        caption: "런너블 = 주기/이벤트 트리거로 실행되는 void 함수.",
      },
      {
        heading: "OS 태스크와 스케줄링",
        body: "AUTOSAR OS는 정적 우선순위 선점형 스케줄러입니다. 런너블들은 알람/이벤트에 묶여 태스크에서 실행됩니다. C 코드 관점에서는 '정해진 주기에 특정 함수가 호출된다'는 계약일 뿐이며, 태스크 간 데이터 교환은 RTE 또는 OS 리소스로 보호됩니다.",
        code: `/* OS 설정 개념 (툴이 생성) */
Task_10ms:   /* 우선순위 2, 주기 10ms */
    App_Control();
    Sensor_Monitor();

Task_100ms:  /* 우선순위 1, 주기 100ms */
    Diag_Poll();

/* ISR 카테고리 2 — OS가 관리하는 인터럽트 */
ISR(Can_Isr) { Can_MainFunction_Read(); }`,
        caption: "주기·우선순위·WCET이 태스크 설계의 3요소입니다.",
      },
      {
        heading: "명명 규칙과 코드 스타일",
        body: "AUTOSAR 생성 코드는 일관된 명명 규칙을 따릅니다. 모듈명_함수명, 타입은 ModuleType_t 또는 _t 접미, 반환 타입은 Std_ReturnType(E_OK, E_NOT_OK). 이 관례를 따라 쓴 개인 프로젝트는 'AUTOSAR 생태계를 이해하는 지원자'라는 강한 신호가 됩니다.",
        code: `/* AUTOSAR 스타일 명명 관례 */
Can_Init, Can_Write, Can_MainFunction_Mode
Std_ReturnType / E_OK / E_NOT_OK
CanIf_RxIndication, PduR_TpTxConfirmation

typedef uint8 Std_ReturnType;
#define E_OK    ((Std_ReturnType)0u)
#define E_NOT_OK ((Std_ReturnType)1u)

Std_ReturnType Sensor_Read(uint16 *value) {
    /* ... */
    return E_OK;
}`,
        caption: "모듈 접두어 + 스네이크 케이스 + _t 타입 — 세 가지만 지키면 절반은 간 것입니다.",
      },
    ],
    keyPoints: [
      "AUTOSAR = ASW(런너블) / RTE(통신) / BSW(하드웨어·OS) 3층.",
      "런너블은 OS 알람에 의해 주기적으로 호출되는 void 함수다.",
      "태스크 설계는 주기·우선순위·WCET, 데이터 교환은 RTE/리소스로 보호.",
      "모듈_함수 명명 규칙과 Std_ReturnType 관례를 익혀 두면 면접과 포트폴리오 모두에서 유리하다.",
    ],
  },
];

export function trackById(id: string): Track | undefined {
  return TRACKS.find((t) => t.id === id);
}

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function lessonsOfTrack(trackId: string): Lesson[] {
  return LESSONS.filter((l) => l.trackId === trackId);
}

export function orderedLessons(): Lesson[] {
  return [...LESSONS].sort((a, b) => {
    const ta = TRACKS.findIndex((t) => t.id === a.trackId);
    const tb = TRACKS.findIndex((t) => t.id === b.trackId);
    if (ta !== tb) return ta - tb;
    return LESSONS.findIndex((l) => l.id === a.id) - LESSONS.findIndex((l) => l.id === b.id);
  });
}
