/**
 * 자동차 임베디드 심화 실습예제
 *
 * examples.ts 패턴을 따라 작성된 자동차 도메인 실습문제입니다.
 * 각 예제는 crunner.ts를 통해 컴파일·실행되며, 시간 초과·메모리 제한 동작을
 * 직접 체험할 수 있도록 설계되었습니다.
 *
 * 주제:
 *   01. AUTOSAR 계층형 Gateway 리팩터링
 *   02. CAN RX 인터럽트와 FreeRTOS Queue
 *   03. CAN TX Queue와 Gateway Routing
 *   04. DBC Signal Codec와 E2E 검증
 *   05. DoIP 기반 Ethernet 진단과 CAN 진단 게이트웨이
 *   06. FMEA와 Safety Mechanism 설계
 *   07. ISO-TP 기반 최소 UDS 서버
 *   08. SIL/HIL CAN 자동 검증
 *   09. SOME-IP 기반 이더넷 게이트웨이와 AUTOSAR Adaptive 확장
 *   10. 기술 발표와 면접 패키지
 *   11. 실시간성·Jitter·Deadline 분석
 *   12. 자동차 사이버보안 TARA
 *   13. 엔디언 검출과 바이트 순서 변환
 *   14. 비트 조작 레지스터 관용구
 *   15. 원형 버퍼(Ring Buffer) 구현
 *   16. volatile과 컴파일러 최적화
 *   17. 구조체 정렬과 패딩 최적화
 *   18. Aligned malloc 구현
 */

export type PracticeLevel = "초급" | "중급" | "고급";

export type PracticeTopic =
  | "AUTOSAR"
  | "CAN"
  | "FreeRTOS"
  | "DBC"
  | "Ethernet"
  | "DoIP"
  | "UDS"
  | "ISO-TP"
  | "SIL/HIL"
  | "SOME-IP"
  | "실시간성"
  | "사이버보안"
  | "TARA"
  | "FMEA"
  | "C 기초"
  | "메모리"
  | "비트연산"
  | "자료구조";

export type Practice = {
  id: string;
  title: string;
  topic: PracticeTopic;
  level: PracticeLevel;
  description: string;
  /** 기대 학습 시간 (분) */
  minutes: number;
  /** 정답 또는 참고 구현 코드 */
  code: string;
  /** 표준 입력 예시 (선택) */
  stdin?: string;
  /** 학습 포인트 목록 */
  keyPoints: string[];
  /** 출처: PDF 제목 */
  source: string;
};

export const PRACTICE_TOPICS: PracticeTopic[] = [
  "AUTOSAR",
  "CAN",
  "FreeRTOS",
  "DBC",
  "Ethernet",
  "DoIP",
  "UDS",
  "ISO-TP",
  "SIL/HIL",
  "SOME-IP",
  "실시간성",
  "사이버보안",
  "TARA",
  "FMEA",
  "C 기초",
  "메모리",
  "비트연산",
  "자료구조",
];

export const PRACTICE_LEVELS: PracticeLevel[] = ["초급", "중급", "고급"];

export const TOPIC_COLOR: Record<PracticeTopic, string> = {
  AUTOSAR: "#b9c2cc",
  CAN: "#f0a13a",
  FreeRTOS: "#45b8ad",
  DBC: "#58c07d",
  Ethernet: "#7c9bd9",
  DoIP: "#9d6ec9",
  UDS: "#e0605e",
  "ISO-TP": "#d4a017",
  "SIL/HIL": "#c08552",
  "SOME-IP": "#5fb4d6",
  "실시간성": "#c64a4a",
  "사이버보안": "#2e5e3e",
  TARA: "#7a4f1d",
  FMEA: "#8b6f8b",
  "C 기초": "#3f8ac0",
  "메모리": "#8a6d3b",
  "비트연산": "#2f9e44",
  "자료구조": "#e8590c",
};

export const PRACTICES: Practice[] = [
  // ─── 01. AUTOSAR 계층형 Gateway 리팩터링 ───────────────────────────
  {
    id: "practice-autosar-gateway",
    title: "01 · AUTOSAR 계층형 Gateway 리팩터링",
    topic: "AUTOSAR",
    level: "고급",
    minutes: 60,
    description:
      "단일 모놀리식 CAN 라우팅 코드를 AUTOSAR 계층(Application / RTE / BSW / MCAL)으로 분리해 계층 간 인터페이스를 명확히 정의합니다. PduR, CanIf, CanTp 모듈의 책임을 헤더 분리만으로 재현해 보세요.",
    keyPoints: [
      "계층 간 결합도 최소화: 상위 계층이 하위 구현을 include 하지 않도록 인터페이스 헤더로만 통신",
      "PduR_Route(): ID 매칭 후 상위 계층 콜백으로 라우팅 위임",
      "단위 테스트 가능성: 각 계층을 모킹해 비즈니스 로직만 검증",
    ],
    source: "다음 실습_ AUTOSAR 계층형 Gateway 리팩터링.pdf",
    code: `#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

/* ── MCAL 계층: 하드웨어 추상화 ───────────────────────── */
typedef struct {
    uint32_t id;
    uint8_t  dlc;
    uint8_t  data[8];
} CanPdu_t;

static CanPdu_t g_rx_buffer[16];
static uint8_t  g_rx_count = 0u;
static CanPdu_t g_tx_buffer[16];
static uint8_t  g_tx_count = 0u;

/* ── BSW 계층: CanIf / PduR 인터페이스 ──────────────── */
typedef struct {
    void (*on_rx)(const CanPdu_t *pdu);
    void (*on_tx_confirm)(uint32_t pdu_id, bool ok);
} CanIf_Config_t;

static const CanIf_Config_t *g_canif_cfg = NULL;

void CanIf_Init(const CanIf_Config_t *cfg) { g_canif_cfg = cfg; }
void CanIf_RxIndication(const CanPdu_t *pdu) {
    if ((g_canif_cfg != NULL) && (g_canif_cfg->on_rx != NULL)) {
        g_canif_cfg->on_rx(pdu);
    }
}

/* ── PduR: 라우팅 테이블 ─────────────────────────────── */
typedef struct {
    uint32_t src_id;
    uint32_t dst_id;
} PduRoute_t;

static const PduRoute_t ROUTES[] = {
    { 0x100u, 0x200u },  /* 게이트웨이: 0x100 → 0x200 */
    { 0x101u, 0x201u },
};
static const uint8_t ROUTE_COUNT = sizeof(ROUTES) / sizeof(ROUTES[0]);

/* ── Application 계층: 비즈니스 로직 ──────────────────── */
static void App_OnCanRx(const CanPdu_t *pdu) {
    printf("[App] RX id=0x%03X dlc=%u\\n", pdu->id, pdu->dlc);
}

static const CanIf_Config_t APP_CONFIG = {
    .on_rx          = App_OnCanRx,
    .on_tx_confirm  = NULL,
};

int main(void) {
    CanIf_Init(&APP_CONFIG);

    /* 시뮬레이션: CAN 버스에서 두 프레임 수신 */
    g_rx_buffer[0] = (CanPdu_t){ .id = 0x100u, .dlc = 4u,
                                  .data = { 0xDE, 0xAD, 0xBE, 0xEF } };
    g_rx_buffer[1] = (CanPdu_t){ .id = 0x999u, .dlc = 0u };  /* 매칭 안 됨 */
    g_rx_count = 2u;

    for (uint8_t i = 0u; i < g_rx_count; i++) {
        const CanPdu_t *rx = &g_rx_buffer[i];
        bool routed = false;

        for (uint8_t r = 0u; r < ROUTE_COUNT; r++) {
            if (rx->id == ROUTES[r].src_id) {
                printf("[PduR] 0x%03X → 0x%03X\\n",
                       ROUTES[r].src_id, ROUTES[r].dst_id);
                routed = true;
                break;
            }
        }
        if (!routed) {
            printf("[PduR] No route for id=0x%03X\\n", rx->id);
        }
        CanIf_RxIndication(rx);
    }
    return 0;
}
`,
  },

  // ─── 02. CAN RX 인터럽트와 FreeRTOS Queue ───────────────────────────
  {
    id: "practice-can-rx-queue",
    title: "02 · CAN RX 인터럽트와 FreeRTOS Queue",
    topic: "FreeRTOS",
    level: "중급",
    minutes: 45,
    description:
      "CAN RX 인터럽트(ISR)와 태스크 간 데이터 전달을 FreeRTOS Queue로 모델링합니다. ISR은 최소 작업만 하고, 무거운 처리는 태스크로 위임합니다.",
    keyPoints: [
      "ISR에서 직접 처리하지 않고 xQueueSendFromISR로 태스크에 위임",
      "volatile 플래그로 큐 적재 시점 표시",
      "태스크 우선순위와 큐 깊이로 처리 지연 설계",
    ],
    source: "다음 실습_ CAN RX 인터럽트와 FreeRTOS Queue.pdf",
    code: `#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

/* FreeRTOS 축소 모델: 실제 헤더를 쓰지 않고 시뮬레이션 */
#define QUEUE_DEPTH 8u

typedef struct {
    uint32_t can_id;
    uint8_t  dlc;
    uint8_t  data[8];
} CanMessage_t;

static CanMessage_t g_queue[QUEUE_DEPTH];
static uint8_t g_head = 0u, g_tail = 0u, g_count = 0u;
static volatile bool g_isr_pending = false;

/* ISR 시뮬레이션: 짧고 결정적이어야 함 */
void CAN_RX_ISR_Handler(const CanMessage_t *msg) {
    if (g_count >= QUEUE_DEPTH) {
        printf("[ISR] 큐 오버플로! 메시지 폐기\\n");
        return;
    }
    g_queue[g_tail] = *msg;
    g_tail = (g_tail + 1u) % QUEUE_DEPTH;
    g_count++;
    g_isr_pending = true;   /* 태스크에 알림 */
}

/* 태스크: 무거운 처리 담당 */
void CAN_Task_Process(void) {
    while (g_count > 0u) {
        CanMessage_t msg = g_queue[g_head];
        g_head = (g_head + 1u) % QUEUE_DEPTH;
        g_count--;
        printf("[Task] 처리 중: id=0x%03X dlc=%u data[0]=0x%02X\\n",
               msg.can_id, msg.dlc, msg.data[0]);
    }
    g_isr_pending = false;
}

int main(void) {
    CanMessage_t m1 = { .can_id = 0x123u, .dlc = 2u, .data = { 0xAA, 0x55 } };
    CanMessage_t m2 = { .can_id = 0x456u, .dlc = 4u, .data = { 0x01, 0x02, 0x03, 0x04 } };

    CAN_RX_ISR_Handler(&m1);
    CAN_RX_ISR_Handler(&m2);

    if (g_isr_pending) {
        printf("[Sched] ISR 알림 감지, 태스크 디스패치\\n");
        CAN_Task_Process();
    }
    return 0;
}
`,
  },

  // ─── 03. CAN TX Queue와 Gateway Routing ───────────────────────────
  {
    id: "practice-can-tx-routing",
    title: "03 · CAN TX Queue와 Gateway Routing",
    topic: "CAN",
    level: "중급",
    minutes: 40,
    description:
      "게이트웨이가 수신한 CAN 프레임을 다른 버스로 라우팅할 때, TX Queue를 통해 순차 전송을 보장합니다.",
    keyPoints: [
      "TX Queue 깊이 관리로 전송 순서 결정 보장",
      "Confirmation 콜백으로 다음 프레임 디스패치",
      "라우팅 우선순위 정책 구현",
    ],
    source: "다음 실습_ CAN TX Queue와 Gateway Routing.pdf",
    code: `#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

#define TX_QUEUE_DEPTH 4u

typedef struct { uint32_t id; uint8_t dlc; uint8_t data[8]; } CanFrame_t;

static CanFrame_t tx_queue[TX_QUEUE_DEPTH];
static uint8_t tx_head = 0u, tx_tail = 0u, tx_count = 0u;

bool TxQueue_Push(const CanFrame_t *frame) {
    if (tx_count >= TX_QUEUE_DEPTH) return false;
    tx_queue[tx_tail] = *frame;
    tx_tail = (tx_tail + 1u) % TX_QUEUE_DEPTH;
    tx_count++;
    return true;
}

bool TxQueue_Pop(CanFrame_t *out) {
    if (tx_count == 0u) return false;
    *out = tx_queue[tx_head];
    tx_head = (tx_head + 1u) % TX_QUEUE_DEPTH;
    tx_count--;
    return true;
}

/* 라우팅: ID 매칭 시 다음 버스로 전달 */
void Gateway_Route(uint32_t src_id, const CanFrame_t *frame) {
    if ((src_id & 0xFF00u) == 0x1200u) {
        /* CAN1 → CAN2 라우팅 */
        if (TxQueue_Push(frame)) {
            printf("[GW] 0x%03X → TX 큐 적재 (depth=%u)\\n",
                   src_id, tx_count);
        } else {
            printf("[GW] 큐 오버플로, 0x%03X 폐기\\n", src_id);
        }
    } else {
        printf("[GW] 0x%03X 라우팅 안 함\\n", src_id);
    }
}

int main(void) {
    CanFrame_t f1 = { .id = 0x1234u, .dlc = 2u, .data = { 0xCA, 0xFE } };
    CanFrame_t f2 = { .id = 0xABCDu, .dlc = 1u, .data = { 0x42 } };

    Gateway_Route(f1.id, &f1);
    Gateway_Route(f2.id, &f2);

    /* TX 처리 시뮬레이션 */
    CanFrame_t out;
    while (TxQueue_Pop(&out)) {
        printf("[TX] 버스로 송신: id=0x%04X\\n", out.id);
    }
    return 0;
}
`,
  },

  // ─── 04. DBC Signal Codec와 E2E 검증 ───────────────────────────
  {
    id: "practice-dbc-codec-e2e",
    title: "04 · DBC Signal Codec와 E2E 검증",
    topic: "DBC",
    level: "중급",
    minutes: 50,
    description:
      "DBC 파일에서 정의한 시그널(Start bit, Length, Byte order, Factor, Offset)을 코덱 함수로 구현하고, E2E 카운터/CRC로 데이터 무결성을 검증합니다.",
    keyPoints: [
      "빅엔디언/리틀엔디언 시그널 추출",
      "Factor·Offset 적용해 물리 값 변환",
      "E2E Profile 4: Counter + CRC16으로 변조·전송 지연 검출",
    ],
    source: "다음 실습_ DBC Signal Codec와 E2E 검증.pdf",
    code: `#include <stdio.h>
#include <stdint.h>
#include <string.h>

/* DBC에서 추출한 메타데이터 */
typedef struct {
    const char  *name;
    uint8_t      start_bit;
    uint8_t      length;
    bool         is_big_endian;
    bool         is_signed;
    double       factor;
    double       offset;
} DbcSignal_t;

static const DbcSignal_t SIG_RPM = {
    .name = "EngineRPM", .start_bit = 0, .length = 16,
    .is_big_endian = true, .is_signed = false,
    .factor = 0.25, .offset = 0.0
};
static const DbcSignal_t SIG_TEMP = {
    .name = "CoolantTemp", .start_bit = 16, .length = 8,
    .is_big_endian = false, .is_signed = true,
    .factor = 1.0, .offset = -40.0
};

/* 빅엔디언 추출 */
uint64_t extract_signal_be(const uint8_t *data, uint8_t start, uint8_t len) {
    uint64_t val = 0;
    for (uint8_t i = 0; i < len; i++) {
        uint8_t byte_idx = (start + i) / 8;
        uint8_t bit_idx  = (start + i) % 8;
        val = (val << 1) | ((data[byte_idx] >> (7 - bit_idx)) & 0x01u);
    }
    return val;
}

/* E2E Profile 4: 간단한 XOR 기반 체크섬 */
uint8_t e2e_checksum(uint8_t counter, const uint8_t *data, uint8_t len) {
    uint8_t cs = counter;
    for (uint8_t i = 0; i < len; i++) cs ^= data[i];
    return cs;
}

int main(void) {
    uint8_t frame[8] = { 0x09, 0xC4, 0x78, 0x00, 0x00, 0xAA, 0x55, 0x00 };

    uint64_t rpm_raw = extract_signal_be(frame, SIG_RPM.start_bit, SIG_RPM.length);
    double rpm = rpm_raw * SIG_RPM.factor + SIG_RPM.offset;
    printf("EngineRPM raw=%llu physical=%.2f rpm\\n",
           (unsigned long long)rpm_raw, rpm);

    int8_t temp_raw = (int8_t)frame[2];
    double temp = temp_raw + SIG_TEMP.offset;
    printf("CoolantTemp raw=%d physical=%.1f °C\\n", temp_raw, temp);

    /* E2E 검증: 카운터는 0..15 순환 */
    uint8_t counter = frame[6] & 0x0Fu;
    uint8_t cs_recv = frame[7];
    uint8_t cs_calc = e2e_checksum(counter, frame, 7);
    printf("E2E counter=%u calc=0x%02X recv=0x%02X %s\\n",
           counter, cs_calc, cs_recv, (cs_calc == cs_recv) ? "OK" : "FAIL");
    return 0;
}
`,
  },

  // ─── 05. DoIP 기반 Ethernet 진단과 CAN 진단 게이트웨이 ───────────────────────────
  {
    id: "practice-doip-can-gateway",
    title: "05 · DoIP 기반 Ethernet 진단과 CAN 진단 게이트웨이",
    topic: "DoIP",
    level: "고급",
    minutes: 70,
    description:
      "UDS 진단 요청을 Ethernet(DoIP)으로 수신해 CAN(ISO-TP)으로 변환·전송하고, 응답을 다시 Ethernet으로 반환하는 게이트웨이를 시뮬레이션합니다.",
    keyPoints: [
      "DoIP 헤더(Protocol Version, Payload Type, Payload Length) 파싱",
      "UDS SID 매핑: 0x10 DiagnosticSessionControl 등",
      "게이트웨이 왕복 지연 측정",
    ],
    source: "다음 실습_ DoIP 기반 Ethernet 진단과 CAN 진단 게이트웨이.pdf",
    code: `#include <stdio.h>
#include <stdint.h>
#include <string.h>

/* DoIP 헤더 (ISO 13400) */
typedef struct {
    uint8_t  protocol_version;
    uint8_t  inverse_version;
    uint16_t payload_type;
    uint32_t payload_length;
} DoIpHeader_t;

static const uint8_t DOIP_HEADER[8] = {
    0x02, 0xFD, 0x00, 0x01, 0x00, 0x00, 0x00, 0x03
};

bool doip_parse(const uint8_t *raw, DoIpHeader_t *out) {
    out->protocol_version = raw[0];
    out->inverse_version  = raw[1];
    out->payload_type     = (raw[2] << 8) | raw[3];
    out->payload_length   = ((uint32_t)raw[4] << 24) | ((uint32_t)raw[5] << 16)
                          | ((uint32_t)raw[6] << 8) | raw[7];
    return (out->protocol_version == 0x02u)
        && ((uint8_t)(out->protocol_version + out->inverse_version) == 0xFFu);
}

int main(void) {
    DoIpHeader_t hdr;
    if (!doip_parse(DOIP_HEADER, &hdr)) {
        printf("잘못된 DoIP 헤더\\n");
        return 1;
    }
    printf("DoIP v=%u payload_type=0x%04X len=%u\\n",
           hdr.protocol_version, hdr.payload_type, hdr.payload_length);

    /* UDS 페이로드 시뮬레이션: 10 02 = DiagnosticSessionControl(Extended) */
    uint8_t uds_payload[] = { 0x10, 0x02 };
    printf("UDS 페이로드: ");
    for (size_t i = 0; i < sizeof(uds_payload); i++) {
        printf("%02X ", uds_payload[i]);
    }
    printf("\\n[GW] CAN(ISO-TP)으로 변환 후 ECU에 전달 → 응답 수신 → Ethernet으로 반환\\n");
    return 0;
}
`,
  },

  // ─── 06. FMEA와 Safety Mechanism 설계 ───────────────────────────
  {
    id: "practice-fmea-safety",
    title: "06 · FMEA와 Safety Mechanism 설계",
    topic: "FMEA",
    level: "고급",
    minutes: 55,
    description:
      "Failure Mode and Effects Analysis(FMEA)로 잠재 결함을 식별하고, ISO 26262 관점에서 Safety Mechanism을 매핑합니다. 예: 센서 단선 → 안전 상태(기본값) 사용.",
    keyPoints: [
      "RPN(우선순위) = Severity × Occurrence × Detection",
      "진단 모듈: 센서 stuck, range check, plausibility",
      "Safety Mechanism: 데드맨 타이머, 워치주, 이중화",
    ],
    source: "다음 실습_ FMEA와 Safety Mechanism 설계.pdf",
    code: `#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

/* 센서 진단 결과 */
typedef enum {
    SENSOR_OK = 0,
    SENSOR_STUCK,
    SENSOR_OUT_OF_RANGE,
    SENSOR_PLAUSIBILITY_FAIL
} SensorDiag_t;

/* 데드맨: 일정 시간 갱신 없으면 안전 상태 */
static uint32_t g_last_update_tick = 0u;
static const uint32_t DEADMAN_LIMIT = 100u;

SensorDiag_t Sensor_Diagnose(uint32_t current_tick,
                              uint16_t raw_value,
                              uint16_t last_raw) {
    /* 1. 데드맨 */
    if ((current_tick - g_last_update_tick) > DEADMAN_LIMIT) {
        return SENSOR_STUCK;
    }
    g_last_update_tick = current_tick;

    /* 2. Range check */
    if ((raw_value < 10u) || (raw_value > 4000u)) {
        return SENSOR_OUT_OF_RANGE;
    }

    /* 3. Plausibility (직전 값과 큰 차이 금지) */
    int diff = (int)raw_value - (int)last_raw;
    if ((diff > 500) || (diff < -500)) {
        return SENSOR_PLAUSIBILITY_FAIL;
    }

    return SENSOR_OK;
}

int main(void) {
    SensorDiag_t d1 = Sensor_Diagnose(100u, 2500u, 2400u);
    printf("tick=100 raw=2500 → %s\\n",
           d1 == SENSOR_OK ? "OK" : "FAIL");

    SensorDiag_t d2 = Sensor_Diagnose(300u, 100u, 2500u);
    printf("tick=300 raw=100  → %s (Safety: 기본값 사용)\\n",
           d2 == SENSOR_OUT_OF_RANGE ? "OUT_OF_RANGE" : "OK");

    return 0;
}
`,
  },

  // ─── 07. ISO-TP 기반 최소 UDS 서버 ───────────────────────────
  {
    id: "practice-isotp-uds",
    title: "07 · ISO-TP 기반 최소 UDS 서버",
    topic: "UDS",
    level: "고급",
    minutes: 60,
    description:
      "ISO-TP의 Single Frame / First Frame / Consecutive Frame / Flow Control로 UDS 페이로드를 조립하고, 최소 UDS 서버(DiagnosticSessionControl, ReadDataByIdentifier)를 구현합니다.",
    keyPoints: [
      "ISO-TP 프레임 타입(Nibble) 구분",
      "FF 다음 CF를 Block Size만큼 수신",
      "UDS SID별 핸들러 등록",
    ],
    source: "다음 실습_ ISO-TP 기반 최소 UDS 서버.pdf",
    code: `#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

#define MAX_UDS_LEN 4095u

/* ISO-TP 프레임 타입 */
typedef enum {
    ISOTP_SF = 0x0u,  /* Single Frame */
    ISOTP_FF = 0x1u,  /* First Frame */
    ISOTP_CF = 0x2u,  /* Consecutive Frame */
    ISOTP_FC = 0x3u,  /* Flow Control */
} IsoTpType_t;

static uint8_t g_uds_buffer[MAX_UDS_LEN];
static uint16_t g_uds_len = 0u;

void isotp_receive(uint8_t pci_byte, const uint8_t *data) {
    IsoTpType_t type = (IsoTpType_t)((pci_byte >> 4) & 0x0Fu);

    switch (type) {
        case ISOTP_SF: {
            uint8_t len = pci_byte & 0x0Fu;
            g_uds_len = len;
            for (uint8_t i = 0; i < len; i++) g_uds_buffer[i] = data[i];
            printf("[ISO-TP] SF 수신 (%u 바이트)\\n", len);
            break;
        }
        case ISOTP_FF: {
            uint16_t len = ((pci_byte & 0x0Fu) << 8) | data[0];
            g_uds_len = len;
            printf("[ISO-TP] FF 수신 (총 %u 바이트)\\n", len);
            /* 이후 CF 처리 로직 추가 필요 */
            break;
        }
        default:
            printf("[ISO-TP] 기타 프레임 타입\\n");
    }
}

/* 최소 UDS 핸들러 */
void uds_dispatch(void) {
    if (g_uds_len == 0u) return;
    uint8_t sid = g_uds_buffer[0];
    switch (sid) {
        case 0x10u:  /* DiagnosticSessionControl */
            printf("[UDS] SessionControl sub=0x%02X\\n", g_uds_buffer[1]);
            break;
        case 0x22u:  /* ReadDataByIdentifier */
            printf("[UDS] ReadDID=0x%02X%02X\\n",
                   g_uds_buffer[1], g_uds_buffer[2]);
            break;
        default:
            printf("[UDS] 알 수 없는 SID 0x%02X\\n", sid);
    }
}

int main(void) {
    /* SF 예시: 22 F1 86 = ReadDID(0xF186 = ActiveSession) */
    uint8_t sf_pci = 0x02u;
    uint8_t sf_data[7] = { 0x22, 0xF1, 0x86, 0, 0, 0, 0 };
    isotp_receive(sf_pci, sf_data);
    uds_dispatch();
    return 0;
}
`,
  },

  // ─── 08. SIL/HIL CAN 자동 검증 ───────────────────────────
  {
    id: "practice-sil-hil-can",
    title: "08 · SIL/HIL CAN 자동 검증",
    topic: "SIL/HIL",
    level: "중급",
    minutes: 50,
    description:
      "Software-in-the-Loop / Hardware-in-the-Loop 환경에서 CAN 메시지를 자동 검증하는 테스트 하네스를 구현합니다. 기대값과 실제값 비교, 시간 윈도우 검증 포함.",
    keyPoints: [
      "기대 메시지 정의(주기, ID, 페이로드)",
      "실측값 캡처 후 주기/지터 검증",
      "Pass/Fail 자동 판정",
    ],
    source: "다음 실습_ SIL_HIL CAN 자동 검증.pdf",
    code: `#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

typedef struct {
    uint32_t id;
    uint16_t period_ms;
    uint8_t  dlc;
} ExpectedMsg_t;

static const ExpectedMsg_t EXPECTED[] = {
    { 0x100u,  10u, 8u },   /* 10ms 주기 */
    { 0x200u, 100u, 4u },   /* 100ms 주기 */
};
static const uint8_t EXP_COUNT = sizeof(EXPECTED) / sizeof(EXPECTED[0]);

typedef struct {
    uint32_t id;
    uint32_t timestamp_ms;
} ObservedMsg_t;

bool verify_period(const ObservedMsg_t *obs, uint8_t n) {
    bool ok = true;
    for (uint8_t e = 0; e < EXP_COUNT; e++) {
        for (uint8_t i = 0; i < n; i++) {
            if (obs[i].id != EXPECTED[e].id) continue;
            if (i == 0) continue;
            uint32_t dt = obs[i].timestamp_ms - obs[i - 1].timestamp_ms;
            uint32_t expected = EXPECTED[e].period_ms;
            uint32_t jitter = (dt > expected) ? (dt - expected) : (expected - dt);
            bool pass = (jitter <= 2u);  /* ±2ms 허용 */
            printf("[TEST] id=0x%03X dt=%u (주기 %u, 지터 %u) %s\\n",
                   obs[i].id, dt, expected, jitter,
                   pass ? "PASS" : "FAIL");
            if (!pass) ok = false;
        }
    }
    return ok;
}

int main(void) {
    ObservedMsg_t obs[] = {
        { 0x100u,    0u }, { 0x100u,   10u }, { 0x100u,   21u },  /* +1ms 지터 */
        { 0x200u,    0u }, { 0x200u,  100u }, { 0x200u,  201u },  /* +1ms 지터 */
    };
    bool result = verify_period(obs, sizeof(obs) / sizeof(obs[0]));
    printf("\\n=== 결과: %s ===\\n", result ? "PASS" : "FAIL");
    return result ? 0 : 1;
}
`,
  },

  // ─── 09. SOME-IP 기반 이더넷 게이트웨이와 AUTOSAR Adaptive 확장 ───────────────────────────
  {
    id: "practice-someip-adaptive",
    title: "09 · SOME-IP 기반 이더넷 게이트웨이와 AUTOSAR Adaptive 확장",
    topic: "SOME-IP",
    level: "고급",
    minutes: 80,
    description:
      "SOME/IP 서비스 디스커버리(Service Discovery)와 RPC 호출을 시뮬레이션하고, Adaptive AUTOSAR ara::com 패턴을 단축 구현합니다.",
    keyPoints: [
      "SOME/IP 메시지 ID 구조: Service ID + Method ID",
      "Offer/StopOffer, Subscribe/Nack 처리",
      "Proxy/Skeleton 패턴",
    ],
    source: "다음 실습_ SOME-IP 기반 이더넷 게이트웨이와 AUTOSAR Adaptive 확장.pdf",
    code: `#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

/* SOME/IP 메시지 헤더 (간소화) */
typedef struct {
    uint16_t service_id;
    uint16_t method_id;
    uint32_t length;
    uint16_t client_id;
    uint16_t session_id;
} SomeIpHeader_t;

static const SomeIpHeader_t OFFER_MSG = {
    .service_id = 0x1234u,
    .method_id  = 0x8001u,   /* SD Offer */
    .length     = 12u,
    .client_id  = 0x0000u,
    .session_id = 0x0001u
};

void sd_offer(const SomeIpHeader_t *msg) {
    if (msg->method_id == 0x8001u) {
        printf("[SD] Offer 수신: Service 0x%04X\\n", msg->service_id);
    }
}

bool rpc_call(const SomeIpHeader_t *req, uint8_t *out, uint8_t out_len) {
    if (req->service_id != 0x1234u) return false;
    printf("[RPC] Service 0x%04X Method 0x%04X 호출\\n",
           req->service_id, req->method_id);
    if ((out != NULL) && (out_len > 0u)) {
        out[0] = 0x01u;  /* 성공 응답 */
    }
    return true;
}

int main(void) {
    sd_offer(&OFFER_MSG);

    SomeIpHeader_t call = {
        .service_id = 0x1234u, .method_id = 0x0001u,
        .length = 4u, .client_id = 0xCAFEu, .session_id = 0x0002u
    };
    uint8_t resp[8] = {0};
    rpc_call(&call, resp, sizeof(resp));
    printf("응답 바이트: ");
    for (size_t i = 0; i < sizeof(resp); i++) printf("%02X ", resp[i]);
    printf("\\n");
    return 0;
}
`,
  },

  // ─── 10. 기술 발표와 면접 패키지 ───────────────────────────
  {
    id: "practice-interview-pack",
    title: "10 · 기술 발표와 면접 패키지",
    topic: "AUTOSAR",
    level: "초급",
    minutes: 30,
    description:
      "AUTOSAR 프로젝트 경험을 5분 발표로 정리하는 연습. 코드는 간단한 메트릭 집계와 요약 출력만 담당합니다.",
    keyPoints: [
      "STAR 기법(Situation, Task, Action, Result)으로 경험 정리",
      "정량적 지표(지연 ms, 메모리 KB) 포함",
      "면접관 후속 질문 대비: trade-off 설명",
    ],
    source: "다음 실습_ 기술 발표와 면접 패키지.pdf",
    code: `#include <stdio.h>
#include <stdint.h>

typedef struct {
    const char *title;
    uint16_t    lines_of_code;
    uint32_t    latency_us;
    uint16_t    memory_kb;
} ProjectMetric_t;

static const ProjectMetric_t PROJECTS[] = {
    { "AUTOSAR Gateway",   12000u, 150u, 384u },
    { "CAN Stack Refactor", 4500u,  80u, 128u },
    { "ISO-TP UDS Server",  3200u, 220u,  96u },
};
static const uint8_t PROJECT_COUNT = sizeof(PROJECTS) / sizeof(PROJECTS[0]);

void print_summary(void) {
    printf("┌──────────────────────────────┬────────┬─────────┬────────┐\\n");
    printf("│ 프로젝트                     │  LoC   │ 지연(μs)│ 메모리  │\\n");
    printf("├──────────────────────────────┼────────┼─────────┼────────┤\\n");
    uint32_t total_loc = 0u, max_lat = 0u, total_mem = 0u;
    for (uint8_t i = 0; i < PROJECT_COUNT; i++) {
        printf("│ %-28s │ %6u │ %7u │ %6u │\\n",
               PROJECTS[i].title,
               PROJECTS[i].lines_of_code,
               PROJECTS[i].latency_us,
               PROJECTS[i].memory_kb);
        total_loc += PROJECTS[i].lines_of_code;
        if (PROJECTS[i].latency_us > max_lat) max_lat = PROJECTS[i].latency_us;
        total_mem += PROJECTS[i].memory_kb;
    }
    printf("├──────────────────────────────┼────────┼─────────┼────────┤\\n");
    printf("│ 합계                         │ %6u │   %5u │ %6u │\\n",
           total_loc, max_lat, total_mem);
    printf("└──────────────────────────────┴────────┴─────────┴────────┘\\n");
}

int main(void) { print_summary(); return 0; }
`,
  },

  // ─── 11. 실시간성·Jitter·Deadline 분석 ───────────────────────────
  {
    id: "practice-realtime-jitter",
    title: "11 · 실시간성·Jitter·Deadline 분석",
    topic: "실시간성",
    level: "중급",
    minutes: 45,
    description:
      "주기 태스크의 실행 시간을 측정해 jitter와 deadline miss 여부를 판별합니다. Worst-case Execution Time(WCET) 기준도 함께 출력합니다.",
    keyPoints: [
      "측정 시점 vs 기상 시점 차이로 jitter 계산",
      "Deadline = 100ms 기준 miss 카운트",
      "WCET 갱신",
    ],
    source: "다음 실습_ 실시간성·Jitter·Deadline 분석.pdf",
    code: `#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

#define PERIOD_MS   10u
#define DEADLINE_MS 100u
#define N_SAMPLES   6u

typedef struct {
    uint32_t wake_tick_ms;
    uint32_t exec_us;
} Sample_t;

void analyze(const Sample_t *s, uint8_t n) {
    uint32_t prev_wake = 0u;
    uint32_t max_jitter_us = 0u;
    uint32_t max_exec_us  = 0u;
    uint32_t misses = 0u;

    for (uint8_t i = 0; i < n; i++) {
        if (i > 0) {
            uint32_t period_us = (s[i].wake_tick_ms - prev_wake) * 1000u;
            uint32_t expected  = PERIOD_MS * 1000u;
            int32_t jitter = (int32_t)period_us - (int32_t)expected;
            if (jitter < 0) jitter = -jitter;
            printf("샘플 %u: wake=%ums exec=%uμs jitter=%dμs\\n",
                   i, s[i].wake_tick_ms, s[i].exec_us, jitter);
            if ((uint32_t)jitter > max_jitter_us) max_jitter_us = jitter;
        } else {
            printf("샘플 %u: wake=%ums exec=%uμs\\n",
                   i, s[i].wake_tick_ms, s[i].exec_us);
        }
        if (s[i].exec_us > max_exec_us) max_exec_us = s[i].exec_us;
        if (s[i].exec_us > DEADLINE_MS * 1000u) misses++;
        prev_wake = s[i].wake_tick_ms;
    }
    printf("\\n최대 jitter: %u μs, WCET: %u μs, deadline miss: %u 회\\n",
           max_jitter_us, max_exec_us, misses);
}

int main(void) {
    Sample_t s[N_SAMPLES] = {
        {   0u,  800u }, {  10u,  850u },
        {  20u,  790u }, {  30u,  900u },   /* 정상 범위 */
        {  40u, 120000u}, {  50u,  810u },   /* 120ms = deadline miss */
    };
    analyze(s, N_SAMPLES);
    return 0;
}
`,
    stdin: "",
  },

  // ─── 12. 자동차 사이버보안 TARA ───────────────────────────
  {
    id: "practice-tara-cyber",
    title: "12 · 자동차 사이버보안 TARA",
    topic: "TARA",
    level: "고급",
    minutes: 60,
    description:
      "Threat Analysis and Risk Assessment(TARA)로 자산·위협·영향도를 매트릭스로 정리하고, 대응 전략(회피/완화/전가/수용)을 결정합니다.",
    keyPoints: [
      "ISO/SAE 21434 TARA 워크플로",
      "Impact × Attack Feasibility → Risk Level",
      "위협 ID별 대응 매핑",
    ],
    source: "다음 실습_ 자동차 사이버보안 TARA.pdf",
    code: `#include <stdio.h>
#include <stdint.h>

typedef enum {
    RISK_LOW = 1,
    RISK_MEDIUM = 2,
    RISK_HIGH = 3
} RiskLevel_t;

typedef enum {
    TREAT_AVOID,    /* 회피: 기능 제거 */
    TREAT_MITIGATE, /* 완화: 방어 메커니즘 */
    TREAT_TRANSFER, /* 전가: 보험 등 */
    TREAT_ACCEPT    /* 수용: 잔여 위험 */
} Treatment_t;

typedef struct {
    const char  *threat_id;
    const char  *description;
    uint8_t      impact;       // 1..5
    uint8_t      feasibility; // 1..5
    Treatment_t  treatment;
} Threat_t;

static const Threat_t THREATS[] = {
    { "TH-001", "CAN 버스 메시지 위조 (RPM 조작)",       5u, 4u, TREAT_MITIGATE },
    { "TH-002", "DoIP 인증 없이 진단 접근",              4u, 3u, TREAT_MITIGATE },
    { "TH-003", "OTA 업데이트 변조",                     5u, 2u, TREAT_MITIGATE },
    { "TH-004", "车内 개인 데이터 유출",                3u, 2u, TREAT_ACCEPT  },
    { "TH-005", "ECU 펌웨어 추출 (리버스 엔지니어링)",   4u, 3u, TREAT_MITIGATE },
};
static const uint8_t THREAT_COUNT = sizeof(THREATS) / sizeof(THREATS[0]);

RiskLevel_t calc_risk(uint8_t impact, uint8_t feasibility) {
    uint16_t score = impact * feasibility;
    if (score >= 16u) return RISK_HIGH;
    if (score >= 8u)  return RISK_MEDIUM;
    return RISK_LOW;
}

int main(void) {
    printf("┌──────────┬─────────────┬─────┬─────┬─────┬────────┐\\n");
    printf("│ 위협 ID  │ 설명         │ I   │ F   │ R   │ 대응   │\\n");
    printf("├──────────┼─────────────┼─────┼─────┼─────┼────────┤\\n");
    for (uint8_t i = 0; i < THREAT_COUNT; i++) {
        RiskLevel_t r = calc_risk(THREATS[i].impact, THREATS[i].feasibility);
        const char *r_str = (r == RISK_HIGH) ? "HIGH"
                          : (r == RISK_MEDIUM) ? "MED " : "LOW ";
        const char *t_str = (THREATS[i].treatment == TREAT_AVOID)    ? "회피"
                          : (THREATS[i].treatment == TREAT_MITIGATE) ? "완화"
                          : (THREATS[i].treatment == TREAT_TRANSFER) ? "전가" : "수용";
        printf("│ %-8s │ %-11s │ %3u │ %3u │ %-3s │ %s\\n",
               THREATS[i].threat_id, THREATS[i].description,
               THREATS[i].impact, THREATS[i].feasibility,
               r_str, t_str);
    }
    printf("└──────────┴─────────────┴─────┴─────┴─────┴────────┘\\n");
    return 0;
}
`,
  },

  // ─── 13. 엔디언 검출과 바이트 순서 변환 ───────────────────────────
  {
    id: "practice-endianness",
    title: "13 · 엔디언 검출과 바이트 순서 변환",
    topic: "C 기초",
    level: "초급",
    minutes: 25,
    description:
      "호스트의 엔디언(리틀/빅)을 union과 포인터 캐스팅으로 검출하고, 네트워크/버스 바이트 순서 변환 함수(swap16/swap32)를 구현합니다. CAN·Ethernet 통신 스택에서 매일 마주치는 문제입니다.",
    keyPoints: [
      "union 멤버 접근으로 메모리 레이아웃 관찰",
      "포인터 캐스팅으로 최하위 바이트 검사",
      "swap16/swap32: 시프트와 마스크로 바이트 재배열",
    ],
    source: "arunkann/embedded_software (GitHub)",
    code: `#include <stdio.h>
#include <stdint.h>

/* 방법 1: union으로 메모리 레이아웃 관찰 */
typedef union {
    uint16_t value;
    uint8_t  bytes[2];
} EndianProbe_t;

/* 방법 2: 포인터 캐스팅으로 최하위 바이트 검사 */
int is_little_endian(void) {
    uint16_t x = 0x0001u;
    return *(uint8_t *)&x == 0x01u;
}

/* 바이트 순서 변환 */
uint16_t swap16(uint16_t v) {
    return (uint16_t)((v << 8) | (v >> 8));
}

uint32_t swap32(uint32_t v) {
    return ((v & 0x000000FFu) << 24)
         | ((v & 0x0000FF00u) << 8)
         | ((v & 0x00FF0000u) >> 8)
         | ((v & 0xFF000000u) >> 24);
}

int main(void) {
    EndianProbe_t probe = { .value = 0x1234u };
    printf("union 검출: bytes[0]=0x%02X → %s 엔디언\\n",
           probe.bytes[0],
           (probe.bytes[0] == 0x34u) ? "리틀" : "빅");
    printf("포인터 검출: %s 엔디언\\n",
           is_little_endian() ? "리틀" : "빅");

    uint16_t net16 = 0x1234u;
    uint32_t net32 = 0x12345678u;
    printf("swap16(0x%04X) = 0x%04X\\n", net16, swap16(net16));
    printf("swap32(0x%08X) = 0x%08X\\n", net32, swap32(net32));
    return 0;
}
`,
  },

  // ─── 14. 비트 조작 레지스터 관용구 ───────────────────────────
  {
    id: "practice-bit-manipulation",
    title: "14 · 비트 조작 레지스터 관용구",
    topic: "비트연산",
    level: "초급",
    minutes: 20,
    description:
      "임베디드 레지스터 조작의 핵심 관용구인 set/clear/toggle/check를 매크로와 함수 두 방식으로 구현합니다. 비트필드 vs 매크로의 trade-off를 이해합니다.",
    keyPoints: [
      "set: |=  / clear: &= ~ / toggle: ^= / check: &",
      "매크로는 타입 검사가 없지만 인라인 확장으로 오버헤드 없음",
      "volatile 레지스터 포인터와 함께 사용하는 이유",
    ],
    source: "arunkann/embedded_software (GitHub)",
    code: `#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

/* 매크로 방식: 타입 검사 없음, 인라인 확장 */
#define BIT_SET(reg, mask)   ((reg) |= (mask))
#define BIT_CLEAR(reg, mask) ((reg) &= ~(mask))
#define BIT_TOGGLE(reg, mask)((reg) ^= (mask))
#define BIT_CHECK(reg, mask) (((reg) & (mask)) != 0u)

/* 함수 방식: 타입 안전, 호출 오버헤드 */
static inline void reg_set(uint32_t *reg, uint32_t mask)   { *reg |= mask; }
static inline void reg_clear(uint32_t *reg, uint32_t mask) { *reg &= ~mask; }
static inline void reg_toggle(uint32_t *reg, uint32_t mask){ *reg ^= mask; }
static inline bool reg_check(const uint32_t *reg, uint32_t mask) {
    return (*reg & mask) != 0u;
}

int main(void) {
    uint32_t reg = 0x00000000u;
    const uint32_t BIT0 = 1u << 0;
    const uint32_t BIT3 = 1u << 3;

    BIT_SET(reg, BIT0 | BIT3);
    printf("set:   0x%08X\\n", reg);

    BIT_CLEAR(reg, BIT3);
    printf("clear: 0x%08X\\n", reg);

    BIT_TOGGLE(reg, BIT0);
    printf("toggle:0x%08X\\n", reg);

    printf("BIT0=%s BIT3=%s\\n",
           BIT_CHECK(reg, BIT0) ? "1" : "0",
           reg_check(&reg, BIT3) ? "1" : "0");
    return 0;
}
`,
  },

  // ─── 15. 원형 버퍼(Ring Buffer) 구현 ───────────────────────────
  {
    id: "practice-ring-buffer",
    title: "15 · 원형 버퍼(Ring Buffer) 구현",
    topic: "자료구조",
    level: "중급",
    minutes: 35,
    description:
      "UART/CAN 수신 스트림에서 가장 많이 쓰는 자료구조인 원형 버퍼를 구현합니다. head/tail 인덱스와 count 기반 full/empty 판정으로 ISR과 태스크 간 안전한 데이터 전달을 모델링합니다.",
    keyPoints: [
      "head(쓰기)/tail(읽기) 인덱스와 모듈로 연산",
      "count 기반 full/empty 판정으로 head==tail 모호성 제거",
      "ISR 생산자·태스크 소비자 패턴의 기초",
    ],
    source: "kedar2017/Embedded_Prep (GitHub)",
    code: `#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

#define RB_SIZE 8u

typedef struct {
    uint8_t buf[RB_SIZE];
    uint8_t head;   /* 다음 쓰기 위치 */
    uint8_t tail;   /* 다음 읽기 위치 */
    uint8_t count;  /* 현재 저장된 요소 수 */
} RingBuffer_t;

void rb_init(RingBuffer_t *rb) {
    rb->head = rb->tail = rb->count = 0u;
}

bool rb_push(RingBuffer_t *rb, uint8_t byte) {
    if (rb->count >= RB_SIZE) return false;  /* full */
    rb->buf[rb->head] = byte;
    rb->head = (rb->head + 1u) % RB_SIZE;
    rb->count++;
    return true;
}

bool rb_pop(RingBuffer_t *rb, uint8_t *out) {
    if (rb->count == 0u) return false;  /* empty */
    *out = rb->buf[rb->tail];
    rb->tail = (rb->tail + 1u) % RB_SIZE;
    rb->count--;
    return true;
}

int main(void) {
    RingBuffer_t rb;
    rb_init(&rb);

    /* 10개 push: 8개 성공, 2개 overflow */
    for (uint8_t i = 0; i < 10u; i++) {
        printf("push %u: %s\\n", i, rb_push(&rb, i) ? "OK" : "FULL");
    }

    /* 전부 pop */
    uint8_t v;
    while (rb_pop(&rb, &v)) {
        printf("pop: %u\\n", v);
    }
    return 0;
}
`,
  },

  // ─── 16. volatile과 컴파일러 최적화 ───────────────────────────
  {
    id: "practice-volatile",
    title: "16 · volatile과 컴파일러 최적화",
    topic: "C 기초",
    level: "중급",
    minutes: 25,
    description:
      "ISR과 공유하는 플래그 변수에 volatile이 필요한 이유를 체험합니다. volatile 없이는 컴파일러가 루프 조건을 최적화로 제거해 무한 루프에 빠질 수 있습니다.",
    keyPoints: [
      "volatile: 컴파일러가 변수 접근을 최적화로 제거/캐시하지 못하게 함",
      "ISR·하드웨어 레지스터·멀티스레드 공유 변수에 필수",
      "volatile은 원자성(atomicity)을 보장하지 않음",
    ],
    source: "kedar2017/Embedded_Prep (GitHub)",
    code: `#include <stdio.h>
#include <stdint.h>

/* volatile: ISR이 바꾸는 값은 최적화 대상이 아님 */
static volatile uint32_t g_flag = 0u;

/* ISR 시뮬레이션 */
void ISR_Handler(void) {
    g_flag = 1u;
}

/* volatile 없이 선언하면 while(g_flag==0)이
   컴파일러에 의해 무한 루프로 최적화될 수 있음 */
uint32_t wait_for_flag(void) {
    uint32_t spins = 0u;
    while (g_flag == 0u) {
        spins++;
        if (spins > 1000000u) break;  /* 안전 장치 */
    }
    return spins;
}

int main(void) {
    printf("flag 초기값: %u\\n", g_flag);
    ISR_Handler();
    uint32_t spins = wait_for_flag();
    printf("flag=%u (spins=%u)\\n", g_flag, spins);
    return 0;
}
`,
  },

  // ─── 17. 구조체 정렬과 패딩 최적화 ───────────────────────────
  {
    id: "practice-struct-alignment",
    title: "17 · 구조체 정렬과 패딩 최적화",
    topic: "메모리",
    level: "중급",
    minutes: 25,
    description:
      "구조체 필드 선언 순서에 따라 패딩 크기가 달라지는 것을 확인하고, 메모리 절약을 위해 필드를 정렬 기준(큰 타입 먼저)으로 재배치합니다. CAN 메시지 버퍼 설계에 직접 적용됩니다.",
    keyPoints: [
      "각 타입의 정렬 요구사항(alignment)과 패딩 삽입 규칙",
      "큰 타입 먼저 선언하면 패딩 최소화",
      "offsetof로 필드 오프셋 검증",
    ],
    source: "kedar2017/Embedded_Prep (GitHub)",
    code: `#include <stdio.h>
#include <stdint.h>
#include <stddef.h>

/* 비효율: 작은 타입 먼저 → 패딩 증가 */
typedef struct {
    uint8_t  a;   /* 1 */
    uint32_t b;   /* 4 (3바이트 패딩 뒤) */
    uint8_t  c;   /* 1 */
} BadOrder_t;     /* 총 12바이트 */

/* 효율: 큰 타입 먼저 → 패딩 최소화 */
typedef struct {
    uint32_t b;   /* 4 */
    uint8_t  a;   /* 1 */
    uint8_t  c;   /* 1 */
} GoodOrder_t;    /* 총 8바이트 */

int main(void) {
    printf("BadOrder  size=%zu (패딩 낭비)\\n", sizeof(BadOrder_t));
    printf("GoodOrder size=%zu\\n", sizeof(GoodOrder_t));

    printf("BadOrder offsets: a=%zu b=%zu c=%zu\\n",
           offsetof(BadOrder_t, a),
           offsetof(BadOrder_t, b),
           offsetof(BadOrder_t, c));
    return 0;
}
`,
  },

  // ─── 18. Aligned malloc 구현 ───────────────────────────
  {
    id: "practice-aligned-malloc",
    title: "18 · Aligned malloc 구현",
    topic: "메모리",
    level: "고급",
    minutes: 40,
    description:
      "DMA·SIMD·캐시 라인 정렬이 필요한 메모리를 할당하는 aligned_malloc을 구현합니다. 원본 포인터를 정렬된 주소 앞에 저장해 해제 시 복원하는 기법을 익힙니다.",
    keyPoints: [
      "정렬 주소 계산: (addr + align - 1) & ~(align - 1)",
      "원본 포인터를 정렬 주소 직전 슬롯에 저장",
      "align은 2의 거듭제곱이어야 함",
    ],
    source: "arunkann/embedded_software (GitHub)",
    code: `#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

/* 정렬된 메모리 할당:
   raw = malloc(size + align + sizeof(void*))
   정렬 주소 직전에 원본 포인터를 저장해 free 시 복원 */
void *aligned_malloc(size_t size, size_t align) {
    if (align == 0u || (align & (align - 1u)) != 0u) return NULL;

    uint8_t *raw = (uint8_t *)malloc(size + align + sizeof(void *));
    if (raw == NULL) return NULL;

    uintptr_t addr = (uintptr_t)raw + sizeof(void *);
    uintptr_t aligned = (addr + align - 1u) & ~(uintptr_t)(align - 1u);

    ((void **)aligned)[-1] = raw;   /* 원본 저장 */
    return (void *)aligned;
}

void aligned_free(void *ptr) {
    if (ptr == NULL) return;
    void *raw = ((void **)ptr)[-1];
    free(raw);
}

int main(void) {
    void *p = aligned_malloc(100u, 16u);
    if (p == NULL) { printf("할당 실패\\n"); return 1; }

    printf("주소: %p, 16바이트 정렬: %s\\n", p,
           ((uintptr_t)p % 16u == 0u) ? "YES" : "NO");

    memset(p, 0xAB, 100u);
    aligned_free(p);
    printf("해제 완료\\n");
    return 0;
}
`,
  },
];