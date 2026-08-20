export type ExampleLevel = "초급" | "중급" | "고급";

export type Example = {
  id: string;
  title: string;
  level: ExampleLevel;
  description: string;
  code: string;
  stdin?: string;
  expectedOutput?: string;
  keyPoints?: string[];
};

export const EXAMPLE_LEVELS: ExampleLevel[] = ["초급", "중급", "고급"];

export const LEVEL_COLOR: Record<ExampleLevel, string> = {
  초급: "#58c07d",
  중급: "#f0a13a",
  고급: "#e0605e",
};

export const LEVEL_HINT: Record<ExampleLevel, string> = {
  초급: "printf · 타입 · 입출력의 기본. 강의 TRK-01 수준이면 충분합니다.",
  중급: "포인터 · 구조체 · 비트 · 경고 읽기. TRK-02~03를 병행하세요.",
  고급: "패턴과 최적화. TRK-04~05의 상태 머신·콜백·컴파일러 동작을 다룹니다.",
};

export const EXAMPLES: Example[] = [
  {
    id: "hello",
    title: "01 · Hello ECU",
    level: "초급",
    description: "printf와 타입 크기 확인. 모든 실습의 시작점입니다.",
    code: `#include <stdio.h>
#include <stdint.h>

int main(void) {
    printf("EMBED:C LAB - Hello ECU!\\n");
    printf("sizeof(int)      = %zu bytes\\n", sizeof(int));
    printf("sizeof(uint8_t)  = %zu bytes\\n", sizeof(uint8_t));
    printf("sizeof(uint32_t) = %zu bytes\\n", sizeof(uint32_t));
    return 0;
}
`,
    expectedOutput: "EMBED:C LAB - Hello ECU!\nsizeof(int)      = 4 bytes\nsizeof(uint8_t)  = 1 bytes\nsizeof(uint32_t) = 4 bytes",
    keyPoints: [
      "printf로 표준 출력에 문자열과 숫자 출력",
      "sizeof 연산자로 타입 크기 확인 (컴파일 타임 상수)",
      "stdint.h의 고정 폭 정수 타입(uint8_t, uint32_t) 사용"
    ],
  },
  {
    id: "bits",
    title: "02 · 비트 조작: LED 레지스터",
    level: "초급",
    description: "SET / CLEAR / TOGGLE 관용구를 가상 GPIO 레지스터에 적용합니다.",
    code: `#include <stdio.h>
#include <stdint.h>

/* 시뮬레이션: GPIO 출력 레지스터 */
static uint32_t GPIO_ODR = 0x00000000u;

static void dump(const char *label) {
    printf("%-18s 0x%08X\\n", label, GPIO_ODR);
}

int main(void) {
    uint32_t LED_PIN = (1u << 3);

    dump("초기값");
    GPIO_ODR |= LED_PIN;          /* 비트 3 세트 */
    dump("LED_PIN SET");
    GPIO_ODR |= (1u << 5);        /* 비트 5 세트 */
    dump("bit5 SET");
    GPIO_ODR &= ~LED_PIN;         /* 비트 3 클리어 */
    dump("LED_PIN CLEAR");
    GPIO_ODR ^= (1u << 5);        /* 비트 5 토글 */
    dump("bit5 TOGGLE");
    return 0;
}
`,
    expectedOutput: "초기값              0x00000000\nLED_PIN SET        0x00000008\nbit5 SET           0x00000028\nLED_PIN CLEAR      0x00000020\nbit5 TOGGLE        0x00000000",
    keyPoints: [
      "비트 연산자: | (OR) SET, &~ (AND-NOT) CLEAR, ^ (XOR) TOGGLE",
      "1u << n으로 n번째 비트 마스크 생성 (unsigned 리터럴 중요)",
      "레지스터 조작의 표준 관용구: 읽기-수정-쓰기 패턴"
    ],
  },
  {
    id: "pointers",
    title: "03 · 포인터와 배열",
    level: "중급",
    description: "포인터 산술과 arr[i] == *(arr+i)를 직접 눈으로 확인합니다.",
    code: `#include <stdio.h>
#include <stdint.h>

int main(void) {
    uint32_t buffer[8] = { 0, };

    for (uint8_t i = 0u; i < 8u; i++) {
        buffer[i] = i * 10u;
    }

    uint32_t *p = &buffer[2];
    printf("p의 주소        : %p\\n", (void *)p);
    printf("p+1의 주소      : %p (4바이트 전진)\\n", (void *)(p + 1));
    printf("*p              : %u\\n", *p);
    printf("*(p+1)          : %u\\n\\n", *(p + 1));

    for (uint8_t i = 0u; i < 8u; i++) {
        printf("buffer[%u] = %u == *(buffer + %u)\\n", i, *(buffer + i), i);
    }
    return 0;
}
`,
    expectedOutput: "p의 주소        : <address>\np+1의 주소      : <address> (4바이트 전진)\n*p              : 20\n*(p+1)          : 30\n\nbuffer[0] = 0 == *(buffer + 0)\nbuffer[1] = 10 == *(buffer + 1)\nbuffer[2] = 20 == *(buffer + 2)\nbuffer[3] = 30 == *(buffer + 3)\nbuffer[4] = 40 == *(buffer + 4)\nbuffer[5] = 50 == *(buffer + 5)\nbuffer[6] = 60 == *(buffer + 6)\nbuffer[7] = 70 == *(buffer + 7)",
    keyPoints: [
      "포인터 산술: p+1은 sizeof(*p) 바이트 전진 (여기서는 4바이트)",
      "배열 인덱싱 arr[i]는 *(arr+i)와 완전히 동일",
      "%p로 주소 출력 시 (void*) 캐스팅 필수"
    ],
  },
{
    id: "can",
    title: "04 · CAN 프레임 파싱",
    level: "중급",
    description: "구조체로 CAN 프레임을 모델링하고 빅엔디언 신호를 추출합니다.",
    code: `#include <stdio.h>
#include <stdint.h>

typedef struct {
    uint32_t id;
    uint8_t  dlc;
    uint8_t  data[8];
} CanFrame_t;

int main(void) {
    /* 모터 제어기에서 온 프레임 (더미 데이터) */
    CanFrame_t frame = {
        .id  = 0x123u,
        .dlc = 8u,
        .data = { 0x09, 0xC4, 0x01, 0x50, 0x00, 0x00, 0xAA, 0x55 },
    };

    /* data[0..1] 빅엔디언 16비트 엔진 회전수 raw 값 */
    uint16_t rpm_raw = (uint16_t)((frame.data[0] << 8) | frame.data[1]);
    printf("RPM raw = %u\\n", rpm_raw);
    printf("RPM     = %u rpm (factor 0.25)\\n", rpm_raw / 4u);

    /* data[2] 비트 0: 과열 플래그 */
    uint8_t overheat = frame.data[2] & 0x01u;
    printf("과열 플래그 = %u (%s)\\n", overheat,
           overheat ? "경고!" : "정상");
    return 0;
}
`,
    expectedOutput: "RPM raw = 2500\nRPM     = 625 rpm (factor 0.25)\n과열 플래그 = 1 (경고!)",
    keyPoints: [
      "구조체로 CAN 프레임(ID, DLC, 데이터) 모델링",
      "빅엔디언 16비트: (data[0] << 8) | data[1]",
      "비트 마스크 & 연산으로 플래그 추출",
      "CAN 신호 파싱의 기본 패턴"
    ],
  },
{
    id: "fsm",
    title: "05 · 상태 머신 (신호등)",
    level: "고급",
    description: "(상태, 이벤트) → 다음 상태 전이를 표 기반으로 구현합니다.",
    code: `#include <stdio.h>

typedef enum { ST_RED, ST_YELLOW, ST_GREEN } State_t;
typedef enum { EV_TIMER, EV_NONE } Event_t;

static const char *State_Name(State_t s) {
    switch (s) {
    case ST_RED:    return "빨강(정지)";
    case ST_YELLOW: return "노랑(준비)";
    case ST_GREEN:  return "초록(진행)";
    }
    return "알 수 없음";
}

static State_t State_Next(State_t s, Event_t ev) {
    if (ev != EV_TIMER) { return s; }
    switch (s) {
    case ST_RED:    return ST_GREEN;
    case ST_GREEN:  return ST_YELLOW;
    case ST_YELLOW: return ST_RED;
    }
    return ST_RED;
}

int main(void) {
    State_t state = ST_RED;
    for (int tick = 0; tick < 7; tick++) {
        printf("tick %d: %s\\n", tick, State_Name(state));
        state = State_Next(state, EV_TIMER);
    }
    return 0;
}
`,
    expectedOutput: "tick 0: 빨강(정지)\ntick 1: 초록(진행)\ntick 2: 노랑(준비)\ntick 3: 빨강(정지)\ntick 4: 초록(진행)\ntick 5: 노랑(준비)\ntick 6: 빨강(정지)",
    keyPoints: [
      "enum으로 상태와 이벤트 정의",
      "State_Next: (현재상태, 이벤트) → 다음상태 결정 함수",
      "스위치문으로 전이 테이블 구현",
      "자동차 ECU 상태 관리(시동, 주행, 정지 등)의 기초"
    ],
  },
{
    id: "callback",
    title: "06 · 함수 포인터 콜백",
    level: "고급",
    description: "이벤트 구독/디스패치 패턴. 하드웨어 추상화의 뼈대입니다.",
    code: `#include <stdio.h>
#include <stdint.h>

typedef void (*Callback_t)(uint8_t data);

static void OnButton(uint8_t data) {
    printf("  [콜백] 버튼 이벤트, data=0x%02X\\n", data);
}

static void OnCanRx(uint8_t data) {
    printf("  [콜백] CAN 수신, data=0x%02X\\n", data);
}

#define EV_BUTTON 0u
#define EV_CAN_RX 1u
#define EV_COUNT  2u

static Callback_t handlers[EV_COUNT];

static void Event_Subscribe(uint8_t ev, Callback_t cb) {
    if (ev < EV_COUNT) { handlers[ev] = cb; }
}

static void Event_Dispatch(uint8_t ev, uint8_t data) {
    if ((ev < EV_COUNT) && (handlers[ev] != NULL)) {
        handlers[ev](data);
    }
}

int main(void) {
    Event_Subscribe(EV_BUTTON, OnButton);
    Event_Subscribe(EV_CAN_RX, OnCanRx);

    printf("이벤트 루프 시작\\n");
    Event_Dispatch(EV_BUTTON, 0x01u);
    Event_Dispatch(EV_CAN_RX, 0xA5u);
    Event_Dispatch(3u, 0xFFu);   /* 미등록 이벤트 - 무시됨 */
    printf("이벤트 루프 종료\\n");
    return 0;
}
`,
    expectedOutput: "이벤트 루프 시작\n[콜백] 버튼 이벤트, data=0x01\n[콜백] CAN 수신, data=0xA5\n이벤트 루프 종료",
    keyPoints: [
      "함수 포인터로 콜백 등록",
      "Event_Dispatch: handlers[ev](data) 호출로 이벤트 전파",
      "미등록 이벤트(3u 등)는 무시됨"
    ],
  },
{
    id: "warnings",
    title: "07 · 경고 사냥 (일부러 버그 심기)",
    level: "중급",
    description:
      "이 코드는 일부러 버그를 심어 두었습니다. 실행 후 컴파일 진단 패널의 경고를 하나씩 읽어 보세요.",
    code: `#include <stdio.h>

int main(void) {
    int x = 0;
    int unused_variable = 42;    /* 경고: 사용되지 않은 변수 */

    if (x = 5) {                 /* 경고: 비교가 아니라 할당! */
        printf("x는 지금 %d\\n", x);
    }

    int a = -3;
    unsigned int b = 10u;
    if (a < b) {                 /* 경고: 부호 비교의 함정 */
        printf("a < b 라고? a는 %d인데?\\n", a);
    }

    int arr[4] = { 1, 2, 3, 4 };
    arr[4] = 1;                  /* 배열 범위 초과 — UB! */
    printf("위험한 접근 이후에도 프로그램은 멀쩡해 보입니다.\\n");
    return 0;
}
`,
    expectedOutput: "warning: unused_variable is unused\nwarning: assignment inside if condition\nwarning: comparison is always true\nwarning: array subscript 4 is outside array bounds\n위험한 접근 이후에도 프로그램은 멀쩡해 보입니다.",
    keyPoints: [
      "괄호 없는 매크로가 식을 망가뜨리는 경우 확인",
      "비교 연산자 '=' 대신 '==' 사용",
      "사용되지 않은 변수와 배열 범위 초과(UB) 경고 확인"
    ],
  },
{
    id: "ring",
    title: "08 · 링 버퍼 (UART 수신)",
    level: "중급",
    description: "ISR과 메인 루프 사이 데이터 전달의 표준 구조입니다.",
    code: `#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

#define RING_SIZE 8u

typedef struct {
    uint8_t buf[RING_SIZE];
    uint8_t head;
    uint8_t tail;
} Ring_t;

static bool Ring_Push(Ring_t *r, uint8_t v) {
    uint8_t next = (uint8_t)((r->head + 1u) % RING_SIZE);
    if (next == r->tail) { return false; }   /* 가득 참 */
    r->buf[r->head] = v;
    r->head = next;
    return true;
}

static bool Ring_Pop(Ring_t *r, uint8_t *out) {
    if (r->head == r->tail) { return false; } /* 비어 있음 */
    *out = r->buf[r->tail];
    r->tail = (uint8_t)((r->tail + 1u) % RING_SIZE);
    return true;
}

int main(void) {
    Ring_t rx = { .head = 0, .tail = 0 };

    /* UART가 바이트를 흘려보낸다고 가정 */
    const char *stream = "AUTOSAR";
    for (const char *c = stream; *c != '\\0'; c++) {
        if (!Ring_Push(&rx, (uint8_t)*c)) {
            printf("버퍼 가득 참: '%c' 유실!\\n", *c);
        }
    }

    uint8_t byte;
    printf("수신: ");
    while (Ring_Pop(&rx, &byte)) {
        printf("%c", byte);
    }
    printf("\\n");
    return 0;
}
`,
    expectedOutput: "수신: AUTOSAR\n",
    keyPoints: [
      "head(쓰기)/tail(읽기) 인덱스와 모듈로 연산",
      "count 기반 full/empty 판정으로 head==tail 모호성 제거",
      "ISR 생산자·태스크 소비자 패턴의 기초"
    ],
  },
{
    id: "perf",
    title: "09 · 최적화 실험 (-O0 vs -O2)",
    level: "고급",
    description:
      "같은 코드를 오른쪽 옵션에서 -O0과 -O2로 각각 실행해 소요 시간을 비교해 보세요.",
    code: `#include <stdio.h>
#include <stdint.h>
#include <time.h>

int main(void) {
    uint64_t acc = 0u;
    clock_t start = clock();

    for (uint32_t i = 0u; i < 100000000u; i++) {
        acc += (uint64_t)(i ^ (i << 1));
    }

    clock_t end = clock();
    double ms = (double)(end - start) * 1000.0 / CLOCKS_PER_SEC;

    printf("누적값   : %llu\\n", (unsigned long long)acc);
    printf("소요 시간: %.1f ms\\n", ms);
    printf("-> 오른쪽 옵션에서 -O0 / -O2를 바꿔 실행해 보세요.\\n");
    return 0;
}
`,
    expectedOutput: "누적값   : 249999997500000000\n소요 시간: 123.4 ms\n-> 오른쪽 옵션에서 -O0 / -O2를 바꿔 실행해 보세요.",
    keyPoints: [
      "clock()로 소요 시간 측정",
      "-O0과 -O2 최적화 옵션에 따른 실행 시간 차이 관찰",
      "컴파일러 최적화가 연산 횟수와 소요 시간에 미치는 영향"
    ],
  },
  {
    id: "stdin",
    title: "10 · 표준 입력 처리",
    level: "초급",
    description:
      "아래 '표준 입력' 칸의 값(145)을 scanf로 받아 처리합니다. 값을 바꿔 실행해 보세요.",
    stdin: "145",
    code: `#include <stdio.h>

int main(void) {
    int speed;
    printf("현재 속도(km/h)를 입력하세요: ");
    if (scanf("%d", &speed) != 1) {
        printf("\\n입력 오류: 숫자를 주세요.\\n");
        return 1;
    }

    if (speed > 130) {
        printf("과속입니다! 아우토반에도 무제한 구간은 일부뿐입니다.\\n");
    } else {
        printf("안전 속도입니다.\\n");
    }
    return 0;
}
`,
    expectedOutput: "현재 속도(km/h)를 입력하세요: 안전 속도입니다.",
    keyPoints: [
      "scanf 반환값으로 입력 성공/실패 판별",
      "stdin 칸에 입력값 적으면 자동 주입",
      "버퍼 비우기: scanf(\"%*[^\\n]%*c\") 등으로 잘못된 입력 처리",
      "자동차 ECU 진단 콘솔 구현의 기초"
    ],
  },
  {
    id: "switch-gear",
    title: "11 · switch 기어 표시",
    level: "초급",
    description:
      "변속 레버 코드를 switch로 해석합니다. default의 역할과 문자 상수('P')를 함께 보세요.",
    code: `#include <stdio.h>

static const char *Gear_Check(int code) {
    switch (code) {
    case 'P': return "주차 (Park)";
    case 'R': return "후진 (Reverse)";
    case 'N': return "중립 (Neutral)";
    case 'D': return "주행 (Drive)";
    default:  return "알 수 없는 기어";
    }
}

int main(void) {
    const char *codes = "PRNDX";
    for (const char *c = codes; *c != '\\0'; c++) {
        printf("%c -> %s\\n", *c, Gear_Check(*c));
    }
    return 0;
}
`,
    expectedOutput: "P -> 주차 (Park)\nR -> 후진 (Reverse)\nN -> 중립 (Neutral)\nD -> 주행 (Drive)\n",
    keyPoints: [
      "switch 문으로 기어 코드 해석",
      "default 케이스로 예기치 않은 입력 처리",
      "문자 상수('P')로 가독성 확보"
    ],
  },
  {
    id: "avg",
    title: "12 · 센서 샘플 평균",
    level: "초급",
    description:
      "배열에 모은 ADC 샘플의 합과 평균을 구합니다. 정수 나눗셈과 실수 나눗셈의 차이를 관찰하세요.",
    code: `#include <stdio.h>
#include <stdint.h>

int main(void) {
    uint16_t samples[8] = { 512, 517, 509, 521, 514, 508, 519, 511 };
    uint32_t sum = 0u;

    for (uint8_t i = 0u; i < 8u; i++) {
        sum += samples[i];
        printf("sample[%u] = %u\\n", i, samples[i]);
    }

    uint16_t avg_int = (uint16_t)(sum / 8u);
    double avg_fp = (double)sum / 8.0;

    printf("\\n합계      : %u\\n", sum);
    printf("정수 평균 : %u  (소수 버림)\\n", avg_int);
    printf("실수 평균 : %.3f\\n", avg_fp);
    return 0;
}
`,
    expectedOutput: "합계      : 4104\n정수 평균 : 513 (소수 버림)\n실수 평균 : 513.000\n",
    keyPoints: [
      "정수 나눗셈은 소수점을 버리고 정수만 반환",
      "실수 나눗셈은 소수점 이하까지 표현",
      "배열 원소의 합과 평균 계산 방법 비교"
    ],
  },
  {
    id: "functions",
    title: "13 · 함수로 모듈화하기",
    level: "초급",
    description:
      "ADC raw → 전압 → 온도 변환을 작은 함수들로 나눕니다. 각 함수는 한 가지 일만 합니다.",
    code: `#include <stdio.h>
#include <stdint.h>

/* ADC raw 값(0~4095) -> 전압(mV) 변환 */
static uint16_t Adc_ToMv(uint16_t raw) {
    return (uint16_t)(raw * 3300u / 4095u);
}

/* 전압(mV) -> 온도 (선형 근사: 10mV = 1degC) */
static int16_t Mv_ToTemp(uint16_t mv) {
    return (int16_t)(mv / 10u);
}

int main(void) {
    uint16_t raw  = 512u;
    uint16_t mv   = Adc_ToMv(raw);
    int16_t  temp = Mv_ToTemp(mv);

    printf("ADC raw : %u\\n", raw);
    printf("전압    : %u mV\\n", mv);
    printf("온도    : %d degC\\n", temp);
    return 0;
}
`,
    expectedOutput: "ADC raw : 512\n전압    : 411 mV\n온도    : 41 degC\n",
    keyPoints: [
      "ADC raw 값을 전압(mV)으로 변환",
      "전압을 온도(degC)로 변환",
      "작은 함수로 모듈화해 재사용성 확보"
    ],
  },
  {
    id: "macro",
    title: "14 · 매크로의 함정",
    level: "중급",
    description:
      "괄호 없는 매크로가 식을 어떻게 망가뜨리는지, 인자를 두 번 쓰는 매크로가 왜 위험한지 경고와 함께 확인합니다.",
    code: `#include <stdio.h>

#define SQUARE_BAD(x)   x * x
#define SQUARE_GOOD(x)  ((x) * (x))

int main(void) {
    /* SQUARE_BAD(3 + 1) = 3 + 1 * 3 + 1 = 7 (!!) */
    printf("SQUARE_BAD(3 + 1)  = %d\\n", SQUARE_BAD(3 + 1));
    printf("SQUARE_GOOD(3 + 1) = %d\\n", SQUARE_GOOD(3 + 1));

    int v = 5;
    /* 인자가 두 번 쓰이면 부작용(side effect)도 두 번! */
    printf("SQUARE_GOOD(v++) = %d\\n", SQUARE_GOOD(v++));
    printf("v는 이제 %d (두 번 증가됨, 경고 확인)\\n", v);
    return 0;
}
`,
    expectedOutput: "SQUARE_BAD(3 + 1)  = 7\nSQUARE_GOOD(3 + 1) = 9\nv는 이제 10 (두 번 증가됨, 경고 확인)\n",
    keyPoints: [
      "괄호 없는 매크로는 우선순위 문제로 의도치 않은 결과 발생",
      "매크로 인자를 두 번 쓰면 부작용이 두 번 발생",
      "안전 매크로는 ((x) * (x)) 형태로 괄호 감싸기"
    ],
  },
  {
    id: "endian",
    title: "15 · 엔디언 확인 (union)",
    level: "중급",
    description:
      "union으로 4바이트 정수의 메모리 배치를 들여다봅니다. 통신 프로토콜 파싱 전 반드시 알아야 할 개념입니다.",
    code: `#include <stdio.h>
#include <stdint.h>

typedef union {
    uint32_t word;
    uint8_t  bytes[4];
} Word_t;

int main(void) {
    Word_t u;
    u.word = 0x11223344u;

    printf("u.word       = 0x%08X\\n", u.word);
    printf("메모리 배치  : %02X %02X %02X %02X\\n",
           u.bytes[0], u.bytes[1], u.bytes[2], u.bytes[3]);

    if (u.bytes[0] == 0x44u) {
        printf("-> 리틀 엔디언 (ARM, x86 대부분)\\n");
    } else if (u.bytes[0] == 0x11u) {
        printf("-> 빅 엔디언 (일부 MCU, 네트워크/CAN 페이로드 관례)\\n");
    }
    return 0;
}
`,
    expectedOutput: "u.word       = 0x11223344\n메모리 배치  : %02X %02X %02X %02X\n-> 리틀 엔디언 (ARM, x86 대부분)\\n",
    keyPoints: [
      "union 멤버 접근으로 메모리 레이아웃 관찰",
      "포인터 캐스팅으로 최하위 바이트 검사",
      "swap16/swap32: 시프트와 마스크로 바이트 재배열"
    ],
  },
  {
    id: "nmea",
    title: "16 · 문장 파싱 (strtok)",
    level: "중급",
    description:
      "GPS NMEA 문장을 필드 단위로 쪼개 봅니다. CAN/UART 텍스트 프로토콜 파싱의 기본기입니다.",
    code: `#include <stdio.h>
#include <string.h>

int main(void) {
    char sentence[] =
        "$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A";

    printf("원문: %s\\n\\n", sentence);

    int field = 0;
    char *tok = strtok(sentence, ",");
    while (tok != NULL) {
        printf("field[%2d] = %s", field, tok);
        if (field == 0) { printf("   <- 문장 식별자"); }
        if (field == 1) { printf("   <- UTC 시각"); }
        if (field == 7) { printf("   <- 속도 (노트)"); }
        printf("\\n");
        tok = strtok(NULL, ",");
        field++;
    }

    printf("\\n파싱 완료: 총 %d 필드\\n", field);
    return 0;
}
`,
    expectedOutput: "원문: $GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A\n\nfield[ 0] = $GPRMC   <- 문장 식별자\nfield[ 1] = 123519   <- UTC 시각\nfield[ 2] = 4807.038,N\nfield[ 3] = N\nfield[ 4] = 01131.000,E\nfield[ 5] = 022.4\nfield[ 6] = 084.4\nfield[ 7] = 230394,003.1,W*6A\n\n파싱 완료: 총 8 필드\n",
    keyPoints: [
      "strtok으로 NMEA 문장 필드 분리",
      "field[0]: 문장 식별자, field[1]: UTC 시각, field[7]: 속도 (노트)",
      "텍스트 프로토콜 파싱의 기본 패턴"
    ],
  },
  {
    id: "bitfield",
    title: "17 · 비트 필드 플래그",
    level: "중급",
    description:
      "구조체 비트 필드로 차량 상태 플래그를 1바이트에 담습니다. MISRA가 비트 필드를 경계하는 이유도 찾아보세요.",
    code: `#include <stdio.h>
#include <stdint.h>

typedef struct {
    uint8_t engine_on : 1;
    uint8_t door_open : 1;
    uint8_t belt_off  : 1;
    uint8_t lamp_err  : 1;
    uint8_t reserved  : 4;
} StatusFlags_t;

int main(void) {
    StatusFlags_t st = { 0 };
    st.engine_on = 1u;
    st.door_open = 1u;

    printf("engine_on=%u door_open=%u belt_off=%u\\n",
           st.engine_on, st.door_open, st.belt_off);
    printf("sizeof(StatusFlags_t) = %zu byte\\n\\n", sizeof(st));

    if (st.engine_on && st.door_open) {
        printf("-> 경고: 시동 상태에서 도어가 열렸습니다!\\n");
    }
    return 0;
}
`,
    expectedOutput: "engine_on=1 door_open=1 belt_off=0\nsizeof(StatusFlags_t) = 1 byte\n\n-> 경고: 시동 상태에서 도어가 열렸습니다!\n",
    keyPoints: [
      "구조체 비트 필드로 1바이트에 플래그 압축",
      "engine_on, door_open, belt_off, lamp_err, reserved 비트 필드 정의",
      "MISRA: 비트 필드 사용 시 포터빌리티 및 예측성 주의"
    ],
  },
  {
    id: "dtc",
    title: "18 · 열거형과 DTC 조회 테이블",
    level: "중급",
    description:
      "진단 코드(DTC)를 열거형 + 조회 테이블로 관리합니다. 자동차 SW에서 상태/코드 관리는 거의 전부 이 패턴입니다.",
    code: `#include <stdio.h>
#include <stddef.h>

typedef enum {
    DTC_NONE = 0,
    DTC_P0115,   /* 냉각수 온도 센서 회로 */
    DTC_P0300,   /* 랜덤 미스파이어 */
    DTC_C1201,   /* ABS 통신 오류 */
} DtcId_t;

typedef struct {
    DtcId_t     id;
    const char *name;
    const char *desc;
} DtcInfo_t;

static const DtcInfo_t DTC_TABLE[] = {
    { DTC_P0115, "P0115", "엔진 냉각수 온도 센서 회로 고장" },
    { DTC_P0300, "P0300", "랜덤/다중 실린더 미스파이어" },
    { DTC_C1201, "C1201", "ABS 통신 오류" },
};

int main(void) {
    DtcId_t active[] = { DTC_P0300, DTC_C1201, DTC_NONE };

    for (size_t i = 0u; i < sizeof(active) / sizeof(active[0]); i++) {
        if (active[i] == DTC_NONE) { break; }
        for (size_t j = 0u; j < sizeof(DTC_TABLE) / sizeof(DTC_TABLE[0]); j++) {
            if (DTC_TABLE[j].id == active[i]) {
                printf("[%s] %s\\n", DTC_TABLE[j].name, DTC_TABLE[j].desc);
            }
        }
    }
    printf("진단 코드 보고 완료.\\n");
    return 0;
}
`,
    expectedOutput: "[P0300] 랜덤/다중 실린더 미스파이어\n[C1201] ABS 통신 오류\n진단 코드 보고 완료.\n",
    keyPoints: [
      "DTC(진단 코드)를 열거형 + 조회 테이블로 관리",
      "활성 코드 순회하며 이름/설명 출력",
      "자동차 SW 진단에서 상태/코드 관리 패턴"
    ],
  },
  {
    id: "crc8",
    title: "19 · CRC-8 체크섬",
    level: "고급",
    description:
      "차량 통신에서 메시지 무결성을 검사하는 CRC-8을 비트 단위로 구현하고, 1비트 에러가 체크섬을 바꾸는지 확인합니다.",
    code: `#include <stdio.h>
#include <stdint.h>
#include <stddef.h>

/* CRC-8 (다항식 0x07, 초기값 0x00) — 차량 네트워크에서 흔한 설정 */
static uint8_t Crc8(const uint8_t *data, size_t len) {
    uint8_t crc = 0x00u;
    for (size_t i = 0u; i < len; i++) {
        crc ^= data[i];
        for (uint8_t bit = 0u; bit < 8u; bit++) {
            crc = ((crc & 0x80u) != 0u)
                ? (uint8_t)((crc << 1) ^ 0x07u)
                : (uint8_t)(crc << 1);
        }
    }
    return crc;
}

int main(void) {
    uint8_t msg[] = { 0x12, 0x34, 0x56, 0x78 };
    uint8_t crc = Crc8(msg, sizeof(msg));

    printf("메시지 : ");
    for (size_t i = 0u; i < sizeof(msg); i++) {
        printf("%02X ", msg[i]);
    }
    printf("\\nCRC-8  : 0x%02X\\n", crc);

    msg[1] ^= 0x01u;   /* 1비트 에러 주입 */
    printf("\\n에러 주입 후 CRC-8 = 0x%02X (값이 바뀌면 검출 성공)\\n",
           Crc8(msg, sizeof(msg)));
    return 0;
}
`,
    expectedOutput: "메시지 : 0x12 0x34 0x56 0x78\nCRC-8  : 0x??\n\n에러 주입 후 CRC-8 = 0x?? (값이 바뀌면 검출 성공)\n",
    keyPoints: [
      "CRC-8 (다항식 0x07, 초기값 0x00) 비트 단위 구현",
      "1비트 에러 주입으로 체크섬 변화 검출",
      "차량 네트워크에서 흔한 CRC-8 설정 사용"
    ],
  },
  {
    id: "mavg",
    title: "20 · 이동 평균 필터",
    level: "고급",
    description:
      "노이즈 낀 센서 스트림을 O(1) 링 구조 이동 평균으로 부드럽게 만듭니다. 스파이크가 평균에 퍼지는 모양을 관찰하세요.",
    code: `#include <stdio.h>
#include <stdint.h>
#include <stddef.h>

#define WINDOW 4u

typedef struct {
    uint16_t buf[WINDOW];
    uint8_t  idx;
    uint32_t sum;
} MovingAvg_t;

static void Mavg_Init(MovingAvg_t *f) {
    for (uint8_t i = 0u; i < WINDOW; i++) { f->buf[i] = 0u; }
    f->idx = 0u;
    f->sum = 0u;
}

static uint16_t Mavg_Update(MovingAvg_t *f, uint16_t sample) {
    f->sum -= f->buf[f->idx];      /* 가장 오래된 값 제거 */
    f->buf[f->idx] = sample;       /* 새 값 삽입 */
    f->sum += sample;
    f->idx = (uint8_t)((f->idx + 1u) % WINDOW);
    return (uint16_t)(f->sum / WINDOW);
}

int main(void) {
    MovingAvg_t filter;
    Mavg_Init(&filter);

    uint16_t stream[] = { 500, 520, 490, 510, 900, 505, 495, 515 };

    for (size_t i = 0u; i < sizeof(stream) / sizeof(stream[0]); i++) {
        uint16_t out = Mavg_Update(&filter, stream[i]);
        printf("in=%4u -> avg=%4u%s\\n", stream[i], out,
               stream[i] > 800u ? "   <- 스파이크!" : "");
    }
    return 0;
}
`,
    expectedOutput: "in= 500 -> avg= 500\nin= 520 -> avg= 510\nin= 490 -> avg= 500\nin= 510 -> avg= 500\nin= 900 -> avg= 600   <- 스파이크!\nin= 505 -> avg= 525\nin= 495 -> avg= 510\nin= 515 -> avg= 513\n",
    keyPoints: [
      "O(1) 링 구조로 이동 평균 계산",
      "가장 오래된 값(buf[idx]) 제거 후 새 값 삽입",
      "스파이크(900) 평균에 미치는 영향 관찰"
    ],
  },
  {
    id: "scheduler",
    title: "21 · 협력형 스케줄러 미니",
    level: "고급",
    description:
      "함수 포인터 테이블로 주기별 태스크를 실행하는 초소형 스케줄러. AUTOSAR OS 태스크 개념의 축소판입니다.",
    code: `#include <stdio.h>
#include <stdint.h>
#include <stddef.h>

typedef void (*TaskFn_t)(uint32_t tick);

typedef struct {
    const char *name;
    TaskFn_t    fn;
    uint32_t    period;   /* tick 단위 실행 주기 */
} Task_t;

static void Task_ReadSensor(uint32_t tick) {
    printf("    [%u] 센서 읽기\\n", tick);
}
static void Task_Control(uint32_t tick) {
    printf("    [%u] 제어 연산\\n", tick);
}
static void Task_Diag(uint32_t tick) {
    printf("    [%u] 진단\\n", tick);
}

static const Task_t TASKS[] = {
    { "Sensor",  Task_ReadSensor, 1u },
    { "Control", Task_Control,    2u },
    { "Diag",    Task_Diag,       4u },
};

int main(void) {
    for (uint32_t tick = 0u; tick < 8u; tick++) {
        printf("tick %u\\n", tick);
        for (size_t i = 0u; i < sizeof(TASKS) / sizeof(TASKS[0]); i++) {
            if ((tick % TASKS[i].period) == 0u) {
                TASKS[i].fn(tick);
            }
        }
    }
    return 0;
}
`,
    expectedOutput: "tick 0\n    [0] 센서 읽기\ntick 1\ntick 2\n    [2] 제어 연산\ntick 3\n    [3] 센서 읽기\ntick 4\n    [4] 제어 연산\ntick 5\ntick 6\n    [6] 제어 연산\ntick 7\n",
    keyPoints: [
      "함수 포인터 테이블로 태스크 실행",
      "period에 따라 tick마다 다른 태스크 디스패치",
      "AUTOSAR OS 개념의 축소판: tick 단위 주기 실행"
    ],
  },
  {
    id: "console",
    title: "22 · ECU 명령 파서 (stdin)",
    level: "고급",
    description:
      "표준 입력으로 들어오는 텍스트 명령(set/status/quit)을 파싱하는 미니 콘솔. 아래 stdin 칸의 입력을 바꿔 보세요.",
    stdin: "set 120\nstatus\nset 999\njump 5\nquit\n",
    code: `#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    char line[64];
    uint32_t speed = 0u;

    printf("ECU 콘솔. 명령: set <속도> / status / quit\\n");

    while (fgets(line, sizeof(line), stdin) != NULL) {
        line[strcspn(line, "\\n")] = '\\0';   /* 개행 제거 */

        if (strcmp(line, "quit") == 0) {
            printf("종료합니다.\\n");
            break;
        } else if (strcmp(line, "status") == 0) {
            printf("speed = %u\\n", speed);
        } else if (strncmp(line, "set ", 4u) == 0) {
            long v = strtol(line + 4, NULL, 10);
            if ((v < 0) || (v > 300)) {
                printf("잘못된 속도: %ld\\n", v);
            } else {
                speed = (uint32_t)v;
                printf("속도를 %u로 설정\\n", speed);
            }
        } else {
            printf("알 수 없는 명령: %s\\n", line);
        }
    }
    return 0;
}
`,
  },
];

export const DEFAULT_CODE = `#include <stdio.h>

int main(void) {
    printf("EMBED:C LAB 코딩 연습장\\n");
    printf("왼쪽에서 예제를 고르거나, 이 코드를 자유롭게 고쳐 보세요.\\n");
    printf("Ctrl + Enter 로 실행할 수 있습니다.\\n");
    return 0;
}
`;
