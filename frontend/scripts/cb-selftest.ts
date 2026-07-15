import { cbBandFreq, checkCbFrequency } from "../src/bandplan/cbData";

let p = 0;
let f = 0;
const t = (n: string, c: boolean, e?: unknown) => {
  if (c) {
    p++;
    console.log("PASS:", n);
  } else {
    f++;
    console.log("FAIL:", n, e !== undefined ? JSON.stringify(e) : "");
  }
};

const r1 = checkCbFrequency(27.065);
t("27.065 -> Kanal 9", r1.kind === "channel" && r1.ch === 9, r1);
t("Kanal 9 power incl SSB 12", r1.kind === "channel" && r1.power.includes("SSB 12"));
const r3 = checkCbFrequency(26.715);
t("26.715 -> Kanal 56 FM only", r3.kind === "channel" && r3.ch === 56 && r3.power.includes("nur FM"), r3);
const r4 = checkCbFrequency(27.025);
t("27.025 Kanal 6 Datenkanal", r4.kind === "channel" && r4.data === true, r4);
const r5 = checkCbFrequency(27.035);
t("27.035 Kanal 7 Datenkanal (user list)", r5.kind === "channel" && r5.ch === 7 && r5.data === true, r5);
const r6 = checkCbFrequency(27.5);
t("27.5 outside", r6.kind === "outside", r6);
const r7 = checkCbFrequency(26.9995);
t("26.9995 in-range no channel", r7.kind === "no-channel", r7);

t("Band A ch1 = 26.965", cbBandFreq("A", 1) === 26.965, cbBandFreq("A", 1));
t("Band A ch40 = 27.405", cbBandFreq("A", 40) === 27.405);
t("Band D ch25 = 28.145 (OCR fix)", cbBandFreq("D", 25) === 28.145, cbBandFreq("D", 25));
t("Band J ch40 = 30.105", cbBandFreq("J", 40) === 30.105, cbBandFreq("J", 40));
t("Band H ch1 = 28.765", cbBandFreq("H", 1) === 28.765, cbBandFreq("H", 1));
t("Band C ch1 = 26.515", cbBandFreq("C", 1) === 26.515, cbBandFreq("C", 1));

console.log(`\nRESULT: ${p} passed, ${f} failed`);
if (f > 0) process.exit(1);
