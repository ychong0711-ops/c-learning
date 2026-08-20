const fs = require('fs');
const content = fs.readFileSync('src/data/practice.ts', 'utf8');
const lines = content.split('\n');

let output = '';
let i = 0;
while (i < lines.length) {
  const line = lines[i];
  output += line + '\n';
  
  // Check if this is a source line
  const isSourceLine = line.includes('source: "다음 실습_') || 
                       line.includes('source: "arunkann/') || 
                       line.includes('source: "kedar2017/');
  
  if (isSourceLine) {
    // Skip any existing expectedOutput lines right after source
    let j = i + 1;
    while (j < lines.length && lines[j].includes('expectedOutput:')) {
      j++;
    }
    // Add our expectedOutput after source (will be added in next iteration when i increments)
    // We'll handle this by adding after the loop continues
    i = j - 1; // Skip the duplicates
  }
  i++;
}

// Now we need to re-process to add expectedOutput after each source
// Let me just do it properly in one pass
const lines2 = output.split('\n');
let output2 = '';
const expectedOutputs = [
  '[PduR] 0x100 -> 0x200\n[PduR] 0x101 -> 0x201\n[PduR] No route for id=0x3FF',
  '[ISR] RX queue full, dropping frame\n[Task] Processing frame id=0x123\n[Task] Frame processed',
  '[GW] 0x1234 -> TX queue (depth=1)\n[GW] 0xABCD -> TX queue (depth=2)\n[GW] TX complete',
  'Signal: rpm=2500\nSignal: temp=90\nE2E: counter=5 CRC=0x3A OK',
  '[DoIP] Vehicle ID response sent\n[DoIP] Routing activation OK\n[CAN] DID 0xF190 read: VIN123456',
  'FMEA: ID=FM-01 Severity=9 Occurrence=4 Detection=3 RPN=108\nSafety Goal: SG-01 ASIL=D',
  '[ISO-TP] FC received: BS=0 STmin=0\n[UDS] 0x22 F190 positive response\nVIN: ABCDEF123456789',
  '[SIL] Test TC-01: PASS\n[SIL] Test TC-02: PASS\n[HIL] CAN trace matched: 100%',
  '[SOME-IP] Service 0x1234 method 0x0011 called\n[GW] Forwarded to CAN id=0x200\n[SOME-IP] Response sent',
  'Presentation: Intro (2min)\nPresentation: Architecture (5min)\nPresentation: Demo (3min)',
  'Task: period=10ms WCET=2.3ms\nJitter: max=0.8ms\nDeadline miss: 0/1000',
  'TARA: Asset=ECU Firmware\nThreat: T-01 Spoofing\nRisk: High -> Mitigated by Auth',
  'System: Little Endian\n0x11223344 -> 0x44 0x33 0x22 0x11\nswap32(0x11223344) = 0x44332211',
  'REG = 0x00\nSET bit 3 -> 0x08\nCLEAR bit 3 -> 0x00\nTOGGLE bit 5 -> 0x20\nTOGGLE bit 5 -> 0x00',
  'Push: 1 2 3 4\nPop: 1 2\nPush: 5 6\nBuffer: 3 4 5 6',
  'Without volatile: loop optimized away\nWith volatile: reads=1000000\nValue: 42',
  'sizeof(Unaligned)=24\nsizeof(Aligned)=16\nPadding saved: 8 bytes',
  'malloc(16) = 0x7f... (aligned)\nmemalign(32, 64) = 0x7f... (32-byte aligned)\nAll alignments verified'
];

let srcIdx = 0;
for (let i = 0; i < lines2.length; i++) {
  output2 += lines2[i] + '\n';
  if (lines2[i].includes('source: "다음 실습_') || 
      lines2[i].includes('source: "arunkann/') || 
      lines2[i].includes('source: "kedar2017/')) {
    if (srcIdx < expectedOutputs.length) {
      const esc = expectedOutputs[srcIdx].replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      output2 += '    expectedOutput: "' + esc + '",\n';
      srcIdx++;
    }
  }
}

fs.writeFileSync('src/data/practice.ts', output2);
console.log('Fixed: Added expectedOutput to', srcIdx, 'practices');