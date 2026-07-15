// Pure data + types for the amateur (KW) bandplan. No React/RN imports so the
// lookup logic stays unit-testable. Frequencies are in kHz.
// Source: DARC, simplified HF bandplan, as supplied by the user (Stand Dez. 2025).

export type PowerByClass = { A?: string; E?: string; N?: string; flat?: string };

export type Segment = {
  from: number; // kHz (inclusive)
  to: number; // kHz (inclusive; == from for single spot frequencies)
  alloc?: string; // "primär" | "sekundär" | "ko-primär" | "exklusiv"
  mode: string; // operating mode(s)
  recommended?: string; // recommended calling frequencies / Rufwellen
  bwHz?: number; // max bandwidth in Hz
  power?: PowerByClass;
  note?: string; // free-form remark (beacon project, guard channel, spot freq…)
};

export type Band = {
  id: string;
  name: string; // "160 Meter"
  short: string; // "160 m"
  range: string; // total range for the list row
  unit?: "kHz" | "MHz"; // display unit for segment ranges (default kHz)
  segments: Segment[];
};

export const SOURCE_NOTE =
  "Quelle: DARC-Bandpläne (KW/VHF/UHF), vereinfacht. KW Stand Dez. 2025, 6 m 04/2026, 70 cm 05/2025, 2 m 08/2017.";

export const MAIN_DISCLAIMER =
  "Vereinfachte Übersicht auf Basis von AFuV und IARU-Region-1-Bandplan, Stand Dezember 2025. " +
  "Ersetzt nicht die verbindliche Prüfung der aktuellen offiziellen Bandpläne bei Änderungen.";

// EMCOMM (IARU R1) preferred emergency frequencies in kHz.
export const EMCOMM_KHZ = [3760, 7110, 14300, 18160, 21360];

export const EMCOMM_HINT =
  "IARU-Notfunk-Vorzugsfrequenz – vereinbarter Treffpunkt für organisierten Notfunkverkehr bei " +
  "Katastrophenlagen. Kein garantiert überwachter Rettungskanal.";

export const AFUV_OUTSIDE_HINT =
  "Die Verwendung der internationalen Not-, Dringlichkeits- und Sicherheitszeichen des Seefunk- " +
  "und Flugfunkdienstes ist Funkamateuren gesetzlich nicht gestattet (§ 16 Abs. 9 AFuV).";

const AE = (a: string, e: string): PowerByClass => ({ A: a, E: e });
const AEN = (a: string, e: string, n: string): PowerByClass => ({ A: a, E: e, N: n });
const FLAT = (v: string): PowerByClass => ({ flat: v });

export const BANDS: Band[] = [
  {
    id: "10m",
    name: "10 Meter",
    short: "10 m",
    range: "28000 – 29700 kHz",
    segments: [
      { from: 28000, to: 28070, alloc: "primär", mode: "CW", recommended: "28055 CW QRS / 28060 CW QRP", bwHz: 200, power: AEN("750 W", "100 W", "10 W") },
      { from: 28070, to: 28190, alloc: "primär", mode: "CW/DATA", bwHz: 500, power: AEN("750 W", "100 W", "10 W") },
      { from: 28190, to: 28225, alloc: "exklusiv", mode: "Internationales Bakenprojekt", note: "Internationales Bakenprojekt (exklusiv)" },
      { from: 28225, to: 28300, alloc: "primär", mode: "Baken", bwHz: 2700, power: AEN("750 W", "100 W", "10 W") },
      { from: 28300, to: 29000, alloc: "primär", mode: "alle Betriebsarten", recommended: "28360 SSB QRP", bwHz: 2700, power: AEN("750 W", "100 W", "10 W") },
      { from: 29000, to: 29300, alloc: "primär", mode: "alle Betriebsarten (üblich AM/FM Simplex)", bwHz: 6000, power: AEN("750 W", "100 W", "10 W") },
      { from: 29300, to: 29510, alloc: "primär", mode: "Satellit", bwHz: 6000, power: AEN("750 W", "100 W", "10 W") },
      { from: 29510, to: 29520, mode: "Schutzkanal", note: "Schutzkanal" },
      { from: 29520, to: 29590, alloc: "primär", mode: "FM-Relais-Eingabe", bwHz: 6000, power: AEN("750 W", "100 W", "10 W") },
      { from: 29600, to: 29600, mode: "FM-Anruffrequenz", note: "FM-Anruffrequenz" },
      { from: 29610, to: 29610, mode: "FM-Simplex", note: "FM-Simplex" },
      { from: 29620, to: 29690, alloc: "primär", mode: "FM-Relais-Ausgabe", bwHz: 6000, power: AEN("750 W", "100 W", "10 W") },
    ],
  },
  {
    id: "12m",
    name: "12 Meter",
    short: "12 m",
    range: "24890 – 24990 kHz",
    segments: [
      { from: 24890, to: 24915, alloc: "primär", mode: "CW", recommended: "24906 CW QRP", bwHz: 200, power: FLAT("750 W PEP") },
      { from: 24915, to: 24929, alloc: "primär", mode: "CW/DATA", bwHz: 500, power: FLAT("750 W PEP") },
      { from: 24929, to: 24931, alloc: "exklusiv", mode: "Internationales Bakenprojekt", note: "Internationales Bakenprojekt (exklusiv)" },
      { from: 24931, to: 24990, alloc: "primär", mode: "alle Betriebsarten", recommended: "24950 SSB QRP", bwHz: 2700, power: FLAT("750 W PEP") },
    ],
  },
  {
    id: "15m",
    name: "15 Meter",
    short: "15 m",
    range: "21000 – 21450 kHz",
    segments: [
      { from: 21000, to: 21070, alloc: "primär", mode: "CW", recommended: "21055 CW QRS / 21060 CW QRP", bwHz: 200, power: AE("750 W PEP", "100 W PEP") },
      { from: 21070, to: 21110, alloc: "primär", mode: "CW/DATA", bwHz: 500, power: AE("750 W PEP", "100 W PEP") },
      { from: 21110, to: 21120, alloc: "primär", mode: "CW/DATA (kein SSB)", bwHz: 2700, power: AE("750 W PEP", "100 W PEP") },
      { from: 21120, to: 21149, alloc: "primär", mode: "CW/DATA", bwHz: 500, power: AE("750 W PEP", "100 W PEP") },
      { from: 21149, to: 21151, alloc: "exklusiv", mode: "Internationales Bakenprojekt", note: "Internationales Bakenprojekt (exklusiv)" },
      { from: 21151, to: 21450, alloc: "primär", mode: "alle Betriebsarten", recommended: "21285 SSB QRP / 21360 DL/R1 EMCOMM", bwHz: 2700, power: AE("750 W PEP", "100 W PEP") },
    ],
  },
  {
    id: "17m",
    name: "17 Meter",
    short: "17 m",
    range: "18068 – 18168 kHz",
    segments: [
      { from: 18068, to: 18095, alloc: "primär", mode: "CW", recommended: "18086 CW QRP", bwHz: 200, power: FLAT("750 W PEP") },
      { from: 18095, to: 18109, alloc: "primär", mode: "CW/DATA", bwHz: 500, power: FLAT("750 W PEP") },
      { from: 18109, to: 18111, alloc: "exklusiv", mode: "Internationales Bakenprojekt", note: "Internationales Bakenprojekt (exklusiv)" },
      { from: 18111, to: 18168, alloc: "primär", mode: "alle Betriebsarten", recommended: "18130 SSB QRP / 18160 DL/R1 EMCOMM", bwHz: 2700, power: FLAT("750 W PEP") },
    ],
  },
  {
    id: "20m",
    name: "20 Meter",
    short: "20 m",
    range: "14000 – 14350 kHz",
    segments: [
      { from: 14000, to: 14070, alloc: "primär", mode: "CW", recommended: "14055 CW QRS / 14060 CW QRP", bwHz: 200, power: FLAT("750 W PEP") },
      { from: 14070, to: 14099, alloc: "primär", mode: "CW/DATA", bwHz: 500, power: FLAT("750 W PEP") },
      { from: 14099, to: 14101, alloc: "exklusiv", mode: "Internationales Bakenprojekt", note: "Internationales Bakenprojekt (exklusiv)" },
      { from: 14101, to: 14350, alloc: "primär", mode: "alle Betriebsarten", recommended: "14285 SSB QRP / 14300 DL/R1 EMCOMM", bwHz: 2700, power: FLAT("750 W PEP") },
    ],
  },
  {
    id: "30m",
    name: "30 Meter",
    short: "30 m",
    range: "10100 – 10150 kHz",
    segments: [
      { from: 10100, to: 10130, alloc: "sekundär", mode: "CW", recommended: "10116 CW QRP", bwHz: 200, power: FLAT("150 W PEP") },
      { from: 10130, to: 10150, alloc: "sekundär", mode: "CW/DATA", bwHz: 500, power: FLAT("150 W PEP") },
    ],
  },
  {
    id: "40m",
    name: "40 Meter",
    short: "40 m",
    range: "7000 – 7200 kHz",
    segments: [
      { from: 7000, to: 7040, alloc: "primär", mode: "CW", recommended: "7030 CW QRP", bwHz: 200, power: FLAT("750 W PEP") },
      { from: 7040, to: 7050, alloc: "primär", mode: "CW/DATA", bwHz: 500, power: FLAT("750 W PEP") },
      { from: 7050, to: 7200, alloc: "primär", mode: "alle Betriebsarten", recommended: "7090 SSB QRP / 7110 DL/R1 EMCOMM", bwHz: 2700, power: FLAT("750 W PEP") },
    ],
  },
  {
    id: "60m",
    name: "60 Meter",
    short: "60 m",
    range: "5351,5 – 5366,5 kHz",
    segments: [
      { from: 5351.5, to: 5354.0, alloc: "sekundär", mode: "CW/DATA", bwHz: 200, power: FLAT("9,14 W ERP") },
      { from: 5354.0, to: 5366.0, alloc: "sekundär", mode: "alle Betriebsarten", bwHz: 2700 },
      { from: 5366.0, to: 5366.5, alloc: "sekundär", mode: "Weak Signal", bwHz: 20 },
    ],
  },
  {
    id: "80m",
    name: "80 Meter",
    short: "80 m",
    range: "3500 – 3800 kHz",
    segments: [
      { from: 3500, to: 3570, alloc: "ko-primär", mode: "CW", recommended: "3555 CW QRS / 3560 CW QRP", bwHz: 200, power: AE("750 W PEP", "100 W PEP") },
      { from: 3570, to: 3580, alloc: "ko-primär", mode: "CW/DATA", bwHz: 200, power: AE("750 W PEP", "100 W PEP") },
      { from: 3580, to: 3600, alloc: "ko-primär", mode: "CW/DATA", bwHz: 500, power: AE("750 W PEP", "100 W PEP") },
      { from: 3600, to: 3800, alloc: "ko-primär", mode: "alle Betriebsarten", recommended: "3690 SSB QRP / 3643 DL / 3760 R1 EMCOMM", bwHz: 2700, power: AE("750 W PEP", "100 W PEP") },
    ],
  },
  {
    id: "160m",
    name: "160 Meter",
    short: "160 m",
    range: "1810 – 2000 kHz",
    segments: [
      { from: 1810, to: 1838, alloc: "primär", mode: "CW", recommended: "1836 CW QRS/QRP", bwHz: 200, power: AE("750 W PEP", "100 W PEP") },
      { from: 1838, to: 1840, alloc: "primär", mode: "CW/DATA", bwHz: 500, power: AE("750 W PEP", "100 W PEP") },
      { from: 1840, to: 1850, alloc: "primär", mode: "alle Betriebsarten", bwHz: 2700, power: AE("750 W PEP", "100 W PEP") },
      { from: 1850, to: 1890, alloc: "sekundär", mode: "alle Betriebsarten", bwHz: 2700, power: AE("75 W PEP", "75 W PEP") },
      { from: 1890, to: 2000, alloc: "sekundär", mode: "alle Betriebsarten", bwHz: 2700, power: AE("10 W PEP", "10 W PEP") },
    ],
  },
  {
    id: "23cm",
    name: "23 Zentimeter",
    short: "23 cm",
    range: "1240 – 1300 MHz",
    unit: "MHz",
    segments: [
      { from: 1240000, to: 1243250, alloc: "sekundär", mode: "Digital-Link / FM-DV-Relaiseingaben", bwHz: 50000, power: AE("750 W PEP", "75 W PEP"), note: "Relais-Eingaben (RS01–RS28), DV-DD-Simplex" },
      { from: 1243250, to: 1260000, alloc: "sekundär", mode: "ATV (Amateurfernsehen)", power: AE("750 W PEP", "75 W PEP"), note: "Analog-TV" },
      { from: 1260000, to: 1270000, alloc: "sekundär", mode: "Satellitenbetrieb", power: AE("750 W PEP", "75 W PEP"), note: "Erde → Weltraum" },
      { from: 1270000, to: 1272000, alloc: "sekundär", mode: "FM-DV-Relaiseingaben", bwHz: 25000, power: AE("750 W PEP", "75 W PEP") },
      { from: 1272000, to: 1291000, alloc: "sekundär", mode: "ATV / Breitband", power: AE("750 W PEP", "75 W PEP") },
      { from: 1291000, to: 1296000, alloc: "sekundär", mode: "D-ATV / Digital-Link", power: AE("750 W PEP", "75 W PEP") },
      { from: 1296000, to: 1297000, alloc: "sekundär", mode: "CW/EME · SSB · Schmalband", recommended: "1296,000 CW / 1296,200 SSB-Anruf", bwHz: 2700, power: AE("750 W PEP", "75 W PEP"), note: "1296,000–1296,150 CW exklusiv · Baken 1296,800–1296,994" },
      { from: 1297000, to: 1298000, alloc: "sekundär", mode: "FM-Simplex (auch DV)", recommended: "1297,500 FM-Anruf", bwHz: 25000, power: AE("750 W PEP", "75 W PEP") },
      { from: 1298000, to: 1299000, alloc: "sekundär", mode: "FM-DV-Relaisausgaben", bwHz: 25000, power: AE("750 W PEP", "75 W PEP") },
      { from: 1299000, to: 1300000, alloc: "sekundär", mode: "Digital-Link / DV-Betrieb", bwHz: 25000, power: AE("750 W PEP", "75 W PEP") },
    ],
  },
  {
    id: "70cm",
    name: "70 Zentimeter",
    short: "70 cm",
    range: "430 – 440 MHz",
    unit: "MHz",
    segments: [
      { from: 430000, to: 432000, alloc: "primär", mode: "FM/DV-Relaiseingaben · Digital", bwHz: 25000, power: AE("750 W PEP", "75 W PEP"), note: "Digital Voice, Packet Radio, Relais-Eingaben (+7,6 / +9,4 MHz)" },
      { from: 432000, to: 432100, alloc: "primär", mode: "CW / Telegrafie", recommended: "432,050 CW-Anruf", bwHz: 500, power: AE("750 W PEP", "75 W PEP"), note: "432,025 PSK31 / EME" },
      { from: 432100, to: 432400, alloc: "primär", mode: "SSB / CW", recommended: "432,200 SSB-Anruf", bwHz: 2700, power: AE("750 W PEP", "75 W PEP"), note: "432,370 MGM (FSK441)" },
      { from: 432400, to: 432490, alloc: "primär", mode: "Baken (exklusiv)", bwHz: 500, power: AE("750 W PEP", "75 W PEP"), note: "Kein Sendebetrieb" },
      { from: 432500, to: 433000, alloc: "primär", mode: "Lineartransponder · alle Betriebsarten", bwHz: 20000, power: AE("750 W PEP", "75 W PEP") },
      { from: 433000, to: 435000, alloc: "primär", mode: "ATV · FM-Simplex", recommended: "433,500 FM-Anruf / 433,450 DV-Anruf", bwHz: 20000, power: AE("750 W PEP", "75 W PEP"), note: "434,000 DATV-Zentrum" },
      { from: 435000, to: 438000, alloc: "primär", mode: "Satellitenbetrieb & ATV", power: AE("750 W PEP", "75 W PEP"), note: "DATV bis 2 MHz Bandbreite" },
      { from: 438000, to: 440000, alloc: "primär", mode: "FM/DV-Relaisausgaben · Digital", bwHz: 25000, power: AE("750 W PEP", "75 W PEP"), note: "439,4375 APRS · Relais-Ausgaben" },
    ],
  },
  {
    id: "2m",
    name: "2 Meter",
    short: "2 m",
    range: "144 – 146 MHz",
    unit: "MHz",
    segments: [
      { from: 144000, to: 144110, alloc: "primär", mode: "CW / Telegrafie", recommended: "144,050 CW-Anruf", bwHz: 500, power: AE("750 W PEP", "75 W PEP") },
      { from: 144110, to: 144150, alloc: "primär", mode: "CW · MGM · SSB", bwHz: 2700, power: AE("750 W PEP", "75 W PEP"), note: "EME & MGM · 144,138 PSK-Zentrum" },
      { from: 144150, to: 144400, alloc: "primär", mode: "SSB / CW", recommended: "144,300 SSB-Anruf", bwHz: 2700, power: AE("750 W PEP", "75 W PEP"), note: "144,370 MGM-Anruf" },
      { from: 144400, to: 144490, alloc: "primär", mode: "Baken (exklusiv)", bwHz: 2700, power: AE("750 W PEP", "75 W PEP"), note: "Kein Funkbetrieb · WSPR 144,492" },
      { from: 144500, to: 144794, alloc: "primär", mode: "alle Betriebsarten", recommended: "144,500 SSTV / 144,600 RTTY", bwHz: 20000, power: AE("750 W PEP", "75 W PEP"), note: "Lineartransponder 144,630–144,690" },
      { from: 144794, to: 144990, alloc: "primär", mode: "digitale Sendearten", recommended: "144,800 APRS", bwHz: 20000, power: AE("750 W PEP", "75 W PEP"), note: "DV-Simplex & Gateways" },
      { from: 145000, to: 145194, alloc: "primär", mode: "FM/DV-Relaiseingaben", bwHz: 12500, power: AE("750 W PEP", "75 W PEP"), note: "12,5-kHz-Raster" },
      { from: 145194, to: 145594, alloc: "primär", mode: "FM-Simplex (auch DV)", recommended: "145,500 FM-Anruf / 145,375 DV-Anruf", bwHz: 12500, power: AE("750 W PEP", "75 W PEP"), note: "145,200 Weltraumkommunikation" },
      { from: 145594, to: 145794, alloc: "primär", mode: "FM/DV-Relaisausgaben", bwHz: 12500, power: AE("750 W PEP", "75 W PEP") },
      { from: 145794, to: 146000, alloc: "primär", mode: "Satellitenbetrieb", bwHz: 12500, power: AE("750 W PEP", "75 W PEP"), note: "145,800 Weltraum → Erde (ISS)" },
    ],
  },
  {
    id: "6m",
    name: "6 Meter",
    short: "6 m",
    range: "50 – 52 MHz",
    unit: "MHz",
    segments: [
      { from: 50000, to: 50100, alloc: "sekundär", mode: "CW", recommended: "50,090 CW DX / 50,050 CW EU", bwHz: 2700, power: FLAT("750 W PEP"), note: "50,000–50,030 synchronisierte Baken" },
      { from: 50100, to: 50300, alloc: "sekundär", mode: "SSB / CW", recommended: "50,150 SSB-Anruf (Centre of Activity)", bwHz: 2700, power: FLAT("750 W PEP") },
      { from: 50300, to: 50400, alloc: "sekundär", mode: "MGM / CW (Schmalband)", bwHz: 2700, power: FLAT("750 W PEP"), note: "50,305 PSK · 50,310–50,320 EME · MS" },
      { from: 50400, to: 50500, alloc: "sekundär", mode: "Baken (exklusiv)", bwHz: 1000, power: FLAT("25 W PEP"), note: "WSPR-Baken 50,401 ±500 Hz" },
      { from: 50500, to: 51000, alloc: "sekundär", mode: "alle Betriebsarten", recommended: "50,510 SSTV / 50,630 DV-Anruf", bwHz: 12000, power: FLAT("25 W PEP") },
      { from: 51000, to: 52000, alloc: "sekundär", mode: "alle Betriebsarten (FM/DV)", recommended: "51,510 FM-Anruf", bwHz: 12000, power: FLAT("25 W PEP"), note: "51,210–51,390 Relais-Eingaben · 51,810–51,990 Relais-Ausgaben" },
    ],
  },
];

export function getBand(id: string): Band | undefined {
  return BANDS.find((b) => b.id === id);
}
