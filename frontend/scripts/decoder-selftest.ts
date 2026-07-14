/* Standalone unit test for the pure Morse decode + Goertzel logic.
 * Compiled with tsc (commonjs) and run under Node — no RN/Expo imports here.
 * Run: node_modules/.bin/tsc --module commonjs --target es2019 --esModuleInterop \
 *   --skipLibCheck --outDir /tmp/mtest src/morse/morse.ts src/morse/decoder.ts \
 *   src/morse/goertzel.ts scripts/decoder-selftest.ts && node /tmp/mtest/scripts/decoder-selftest.js
 */
import { MorseDecoder } from "../src/morse/decoder";
import { goertzelPower } from "../src/morse/goertzel";
import { buildTimeline, textToMorse, unitMsFromWpm } from "../src/morse/morse";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra?: string) {
  if (cond) {
    pass++;
    console.log("PASS:", name);
  } else {
    fail++;
    console.log("FAIL:", name, extra ?? "");
  }
}

// Round-trip: text -> morse -> on/off timeline -> decoder -> text.
function roundTrip(text: string, wpm: number, seedWpm: number): string {
  const timeline = buildTimeline(textToMorse(text), unitMsFromWpm(wpm));
  const dec = new MorseDecoder({ initialUnitMs: unitMsFromWpm(seedWpm) });
  timeline.forEach((seg) => (seg.on ? dec.pushTone(seg.ms) : dec.pushGap(seg.ms)));
  dec.finish();
  return dec.transcript;
}

check("roundtrip SOS @20", roundTrip("SOS", 20, 20) === "SOS", roundTrip("SOS", 20, 20));
check("roundtrip HELLO WORLD @20", roundTrip("HELLO WORLD", 20, 20) === "HELLO WORLD", roundTrip("HELLO WORLD", 20, 20));
check("roundtrip CQ DE DL1ABC @25", roundTrip("CQ DE DL1ABC", 25, 25) === "CQ DE DL1ABC", roundTrip("CQ DE DL1ABC", 25, 25));
check("roundtrip punctuation OK, 73! @18", roundTrip("OK, 73!", 18, 18) === "OK, 73!", roundTrip("OK, 73!", 18, 18));

// Adaptive: sender much faster than the seed should still converge.
const adaptOut = roundTrip("PARIS PARIS", 32, 12);
check("adaptive converges (ends with PARIS)", adaptOut.endsWith("PARIS"), adaptOut);

// Goertzel frequency discrimination.
function sine(freq: number, sr: number, n: number): Float32Array {
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = Math.sin((2 * Math.PI * freq * i) / sr);
  return s;
}
const sr = 16000;
const N = 640;
const onTone = goertzelPower(sine(700, sr, N), 700, sr);
const offTone = goertzelPower(sine(300, sr, N), 700, sr);
const silence = goertzelPower(new Float32Array(N), 700, sr);
check("goertzel target >> off-frequency", onTone > offTone * 20, `on=${onTone.toFixed(3)} off=${offTone.toFixed(3)}`);
check("goertzel target >> silence", onTone > silence + 0.001, `on=${onTone.toFixed(3)} sil=${silence.toFixed(6)}`);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
