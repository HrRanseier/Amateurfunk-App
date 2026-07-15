import { findHamSegment, isEmcomm, parseFrequencyKHz } from "../src/bandplan/frequency";

let pass = 0;
let fail = 0;
function t(name: string, cond: boolean, extra?: unknown) {
  if (cond) {
    pass++;
    console.log("PASS:", name);
  } else {
    fail++;
    console.log("FAIL:", name, extra !== undefined ? JSON.stringify(extra) : "");
  }
}

t("7.110 MHz -> 7110 kHz", parseFrequencyKHz("7.110", "MHz") === 7110);
t("7,110 MHz comma -> 7110", parseFrequencyKHz("7,110", "MHz") === 7110);
t("14300 kHz", parseFrequencyKHz("14300", "kHz") === 14300);
t("empty -> null", parseFrequencyKHz("", "kHz") === null);
t("garbage -> null", parseFrequencyKHz("abc", "kHz") === null);

const m1 = findHamSegment(7110);
t("7110 -> 40m alle Betriebsarten", !!m1 && m1.band.id === "40m" && m1.segment.mode === "alle Betriebsarten", m1?.band.id);
t("7110 is EMCOMM", isEmcomm(7110));
const m2 = findHamSegment(14300);
t("14300 -> 20m + EMCOMM", !!m2 && m2.band.id === "20m" && isEmcomm(14300), m2?.band.id);
const m3 = findHamSegment(5352);
t("5352 -> 60m 200Hz seg", !!m3 && m3.band.id === "60m" && m3.segment.bwHz === 200, m3?.band.id);
const m4 = findHamSegment(29600);
t("29600 -> FM-Anruffrequenz spot", !!m4 && m4.segment.mode === "FM-Anruffrequenz", m4?.segment.mode);
t("50000 kHz outside -> null", findHamSegment(50000) === null);
const m6 = findHamSegment(137);
t("137 kHz -> 2200m", !!m6 && m6.band.id === "2200m", m6?.band.id);
const m7 = findHamSegment(14099.5);
t("14099.5 -> beacon exclusive", !!m7 && m7.segment.mode === "Internationales Bakenprojekt", m7?.segment.mode);
t("3760 EMCOMM and in 80m", isEmcomm(3760) && findHamSegment(3760)?.band.id === "80m");
t("27000 kHz outside ham -> null", findHamSegment(27000) === null);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
