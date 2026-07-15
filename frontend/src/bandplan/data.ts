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
  segments: Segment[];
};

export const SOURCE_NOTE = "Quelle: DARC, vereinfachter KW-Bandplan, Stand Dez. 2025.";

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
    id: "2200m",
    name: "2200 Meter",
    short: "2200 m",
    range: "135,7 – 137,8 kHz",
    segments: [
      { from: 135.7, to: 137.8, alloc: "sekundär", mode: "CW/DATA", bwHz: 200, power: FLAT("1 W ERP") },
    ],
  },
  {
    id: "600m",
    name: "600 Meter",
    short: "600 m",
    range: "472 – 479 kHz",
    segments: [
      { from: 472, to: 475, alloc: "sekundär", mode: "CW", bwHz: 200, power: FLAT("1 W ERP") },
      { from: 475, to: 479, alloc: "sekundär", mode: "CW/DATA", bwHz: 500 },
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
];

export function getBand(id: string): Band | undefined {
  return BANDS.find((b) => b.id === id);
}
