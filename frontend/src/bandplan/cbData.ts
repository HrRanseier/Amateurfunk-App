// CB radio (11 m) data. Sources supplied by the user:
//  - PDF 1: official German 80-channel list (BNetzA Vfg 21/2021)
//  - PDF 2: President Jackson 2 / Lincoln 2+ international band table (A–J)
// Bands B–J are exactly Band A shifted by a fixed per-band offset (verified
// against the PDF for every sampled cell), so we derive them from Band A to
// guarantee correctness and avoid transcription errors.

export type CbChannel = { ch: number; freqMHz: number; note?: string };

const GATEWAY = "Gateway-Funk freigegeben (Zusammenschaltung mehrerer CB-Geräte über Internet)";

// Channel 9: DO NOT label as an official emergency channel — user-mandated text.
export const CH9_NOTE =
  "Verbreitet als Anrufkanal/informeller Notrufkanal genutzt – keine amtliche Festlegung der Bundesnetzagentur.";

export const CB_CHANNELS: CbChannel[] = [
  { ch: 1, freqMHz: 26.965, note: "empfohlener Anrufkanal (FM)" },
  { ch: 2, freqMHz: 26.975, note: "inoffizieller Berg-DX-Kanal (FM)" },
  { ch: 3, freqMHz: 26.985 },
  { ch: 4, freqMHz: 27.005, note: "empfohlener Anrufkanal (AM)" },
  { ch: 5, freqMHz: 27.015, note: "Datenkanal (FM)" },
  { ch: 6, freqMHz: 27.025, note: "Datenkanal (FM)" },
  { ch: 7, freqMHz: 27.035 },
  { ch: 8, freqMHz: 27.055 },
  { ch: 9, freqMHz: 27.065, note: CH9_NOTE },
  { ch: 10, freqMHz: 27.075 },
  { ch: 11, freqMHz: 27.085, note: GATEWAY },
  { ch: 12, freqMHz: 27.105 },
  { ch: 13, freqMHz: 27.115 },
  { ch: 14, freqMHz: 27.125 },
  { ch: 15, freqMHz: 27.135, note: "inoffizieller Anrufkanal SSB (USB)" },
  { ch: 16, freqMHz: 27.155, note: "Funkverkehr mit/zwischen Wasserfahrzeugen" },
  { ch: 17, freqMHz: 27.165 },
  { ch: 18, freqMHz: 27.175 },
  { ch: 19, freqMHz: 27.185, note: "empfohlener Fernfahrerkanal (FM)" },
  { ch: 20, freqMHz: 27.205 },
  { ch: 21, freqMHz: 27.215, note: "türkischer Anrufkanal (FM)" },
  { ch: 22, freqMHz: 27.225, note: "oft von Walkie-Talkies/Babyphonen genutzt" },
  { ch: 23, freqMHz: 27.255 },
  { ch: 24, freqMHz: 27.235, note: "Datenkanal" },
  { ch: 25, freqMHz: 27.245, note: "Datenkanal" },
  { ch: 26, freqMHz: 27.265 },
  { ch: 27, freqMHz: 27.275 },
  { ch: 28, freqMHz: 27.285, note: "von polnischen Fernfahrern genutzt" },
  { ch: 29, freqMHz: 27.295, note: GATEWAY },
  { ch: 30, freqMHz: 27.305, note: "inoffizieller DX-Kanal (FM)" },
  { ch: 31, freqMHz: 27.315, note: "inoffizieller DX-Kanal (FM)" },
  { ch: 32, freqMHz: 27.325 },
  { ch: 33, freqMHz: 27.335 },
  { ch: 34, freqMHz: 27.345, note: GATEWAY },
  { ch: 35, freqMHz: 27.355 },
  { ch: 36, freqMHz: 27.365 },
  { ch: 37, freqMHz: 27.375 },
  { ch: 38, freqMHz: 27.385 },
  { ch: 39, freqMHz: 27.395, note: GATEWAY },
  { ch: 40, freqMHz: 27.405, note: GATEWAY + " (FM/AM/SSB)" },
  { ch: 41, freqMHz: 26.565, note: GATEWAY + " (FM)" },
  { ch: 42, freqMHz: 26.575, note: "inoffizieller DX-Kanal (FM)" },
  { ch: 43, freqMHz: 26.585 },
  { ch: 44, freqMHz: 26.595 },
  { ch: 45, freqMHz: 26.605 },
  { ch: 46, freqMHz: 26.615 },
  { ch: 47, freqMHz: 26.625 },
  { ch: 48, freqMHz: 26.635 },
  { ch: 49, freqMHz: 26.645 },
  { ch: 50, freqMHz: 26.655 },
  { ch: 51, freqMHz: 26.665 },
  { ch: 52, freqMHz: 26.675 },
  { ch: 53, freqMHz: 26.685 },
  { ch: 54, freqMHz: 26.695 },
  { ch: 55, freqMHz: 26.705 },
  { ch: 56, freqMHz: 26.715, note: "Datenkanal (FM)" },
  { ch: 57, freqMHz: 26.725 },
  { ch: 58, freqMHz: 26.735 },
  { ch: 59, freqMHz: 26.745 },
  { ch: 60, freqMHz: 26.755 },
  { ch: 61, freqMHz: 26.765, note: GATEWAY },
  { ch: 62, freqMHz: 26.775 },
  { ch: 63, freqMHz: 26.785 },
  { ch: 64, freqMHz: 26.795 },
  { ch: 65, freqMHz: 26.805 },
  { ch: 66, freqMHz: 26.815 },
  { ch: 67, freqMHz: 26.825 },
  { ch: 68, freqMHz: 26.835 },
  { ch: 69, freqMHz: 26.845 },
  { ch: 70, freqMHz: 26.855 },
  { ch: 71, freqMHz: 26.865, note: GATEWAY },
  { ch: 72, freqMHz: 26.875 },
  { ch: 73, freqMHz: 26.885 },
  { ch: 74, freqMHz: 26.895 },
  { ch: 75, freqMHz: 26.905 },
  { ch: 76, freqMHz: 26.915, note: "Datenkanal (FM)" },
  { ch: 77, freqMHz: 26.925, note: "Datenkanal (FM)" },
  { ch: 78, freqMHz: 26.935 },
  { ch: 79, freqMHz: 26.945 },
  { ch: 80, freqMHz: 26.955, note: GATEWAY },
];

// German CB allocation limits (MHz).
export const CB_MIN = 26.565;
export const CB_MAX = 27.405;

// Data channels flagged in the "Frequenz prüfen (CB)" result (user-specified).
const DATA_CHANNEL_SET = new Set([6, 7, 24, 25, 52, 53, 76, 77]);
export const isDataChannel = (ch: number) => DATA_CHANNEL_SET.has(ch);

export const CB_POWER_1_40 = "AM 4 Watt ERP · FM 4 Watt ERP · SSB 12 Watt PEP";
export const CB_POWER_41_80 = "nur FM 4 Watt ERP";

export const CB_OUTSIDE = "Außerhalb der deutschen CB-Funk-Zuteilung (Vfg 21/2021 der Bundesnetzagentur)";
export const CB_NO_CHANNEL = "Diese Frequenz entspricht keinem offiziellen CB-Kanal.";

// --- International band table (A–J), channels 1–40 ---
export const CB_BAND_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;
export type CbBandLetter = (typeof CB_BAND_LETTERS)[number];

const BAND_A_FREQS = CB_CHANNELS.slice(0, 40).map((c) => c.freqMHz);
const BAND_OFFSET: Record<CbBandLetter, number> = {
  A: 0,
  B: 0.45,
  C: -0.45,
  D: 0.9,
  E: -0.9,
  F: 1.35,
  G: -1.35,
  H: 1.8,
  I: 2.25,
  J: 2.7,
};

export function cbBandFreq(band: CbBandLetter, ch: number): number | null {
  if (ch < 1 || ch > 40) return null;
  return Math.round((BAND_A_FREQS[ch - 1] + BAND_OFFSET[band]) * 1000) / 1000;
}

export const CB_BAND_A_OK = "Standard-Kanal, legal in Deutschland nutzbar";
export const CB_BAND_BJ_WARN =
  "Außerhalb der deutschen CB-Funk-Zuteilung. Diese Frequenzen stammen aus Export-Kanalbelegungen " +
  "bestimmter Funkgeräte, sind aber nicht durch die deutsche Allgemeinzuteilung (Vfg 21/2021) abgedeckt. " +
  "Teilweise Überschneidung mit anderen zugewiesenen Funkdiensten (z. B. dem 10-Meter-Amateurfunkband).";

export type CbCheckResult =
  | { kind: "channel"; ch: number; freqMHz: number; power: string; data: boolean }
  | { kind: "outside" }
  | { kind: "no-channel" };

export function checkCbFrequency(mhz: number): CbCheckResult {
  const hit = CB_CHANNELS.find((c) => Math.abs(c.freqMHz - mhz) < 0.0005);
  if (hit) {
    return {
      kind: "channel",
      ch: hit.ch,
      freqMHz: hit.freqMHz,
      power: hit.ch <= 40 ? CB_POWER_1_40 : CB_POWER_41_80,
      data: isDataChannel(hit.ch),
    };
  }
  if (mhz < CB_MIN - 1e-6 || mhz > CB_MAX + 1e-6) return { kind: "outside" };
  return { kind: "no-channel" };
}

export const formatMHz = (n: number) => n.toFixed(3).replace(".", ",");
