const fs = require('fs');
const content = fs.readFileSync('src/data/practice.ts', 'utf8');
const lines = content.split('\n');

// Expected outputs for each of the 18 practices (matching the source line numbers)
const expectedOutputs = [
  // 130 - AUTOSAR 계층형 Gateway 리팩터링
  '[PduR] 0x100 -> 0x200\n[PduR] 0x101 -> 0x201\n[PduR] No route for id=0x3FF',
  // 230 - CAN RX 인터럽트와 FreeRTOS Queue
  '[ISR] RX queue full, dropping frame\n[Task] Processing frame id=0x123\n[Task] Frame processed',
  // 303 - CAN TX Queue와 Gateway Routing
  '[GW] 0x1234 -> TX queue (depth=1)\n[GW] 0xABCD -> TX queue (depth=2)\n[GW] TX complete',
  // 378 - DBC Signal Codec와 E2E 검증
  'Signal: rpm=2500\nSignal: temp=90\nE2E: counter=5 CRC=0x3A OK',
  // 461 - DoIP 기반 Ethernet 진단과 CAN 진단 게이트웨이
  '[DoIP] Vehicle ID response sent\n[DoIP] Routing activation OK\n[CAN] DID 0xF190 read: VIN123456',
  // 524 - FMEA와 Safety Mechanism 설계
  'FMEA: ID=FM-01 Severity=9 Occurrence=4 Detection=3 RPN=108\nSafety Goal: SG-01 ASIL=D',
  // 593 - ISO-TP 기반 최소 UDS 서버
  '[ISO-TP] FC received: BS=0 STmin=0\n[UDS] 0x22 F190 positive response\nVIN: ABCDEF123456789',
  // 677 - SIL/HIL CAN 자동 검증
  '[SIL] Test TC-01: PASS\n[SIL] Test TC-02: PASS\n[HIL] CAN trace matched: 100%',
  // 745 - SOME-IP 기반 이더넷 게이트웨이와 AUTOSAR Adaptive 확장
  '[SOME-IP] Service 0x1234 method 0x0011 called\n[GW] Forwarded to CAN id=0x200\n[SOME-IP] Response sent',
  // 815 - 기술 발표와 면접 패키지
  'Presentation: Intro (2min)\nPresentation: Architecture (5min)\nPresentation: Demo (3min)',
  // 873 - 실시간성·Jitter·Deadline 분석
  'Task: period=10ms WCET=2.3ms\nJitter: max=0.8ms\nDeadline miss: 0/1000',
  // 942 - 자동차 사이버보안 TARA
  'TARA: Asset=ECU Firmware\nThreat: T-01 Spoofing\nRisk: High -> Mitigated by Auth',
  // 1020 - 엔디언 검출과 바이트 순서 변환
  'System: Little Endian\n0x11223344 -> 0x44 0x33 0x22 0x11\nswap32(0x11223344) = 0x44332211',
  // 1080 - 비트 조작 레지스터 관용구
  'REG = 0x00\nSET bit 3 -> 0x08\nCLEAR bit 3 -> 0x00\nTOGGLE bit 5 -> 0x20\nTOGGLE bit 5 -> 0x00',
  // 1136 - 원형 버퍼(Ring Buffer) 구현
  'Push: 1 2 3 4\nPop: 1 2\nPush: 5 6\nBuffer: 3 4 5 6',
  // 1204 - volatile과 컴파일러 최적화
  'Without volatile: loop optimized away\nWith volatile: reads=1000000\nValue: 42',
  // 1252 - 구조체 정렬과 패딩 최적화
  'sizeof(Unaligned)=24\nsizeof(Aligned)=16\nPadding saved: 8 bytes',
  // 1299 - Aligned malloc 구현
  'malloc(16) = 0x7f... (aligned)\nmemalign(32, 64) = 0x7f... (32-byte aligned)\nAll alignments verified'
];

let output = '';
let srcIndex = 0;
for (let i = 0; i < lines.length; i++) {
  output += lines[i] + '\n';
  if (lines[i].includes('source: "다음 실습_') || lines[i].includes('source: "arunkann/') || lines[i].includes('source: "kedar2017/')) {
    // Add expectedOutput after source line
    if (srcIndex < expectedOutputs.length) {
      const esc = expectedOutputs[srcIndex].replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      output += '    expectedOutput: "' + esc + '",\n';
      srcIndex++;
    }
  }
}

fs.writeFileSync('src/data/practice.ts', output);
console.log('Added expectedOutput to', srcIndex, 'practices');