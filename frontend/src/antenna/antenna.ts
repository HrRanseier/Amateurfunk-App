// Pure antenna calculation logic (no React/RN imports) — unit-testable.

export type Lambda = "1/4" | "1/2" | "5/8" | "1/1";
export type OneWhole = "stretched" | "loop";

export const LAMBDA_LABEL: Record<Lambda, string> = {
  "1/4": "λ/4",
  "1/2": "λ/2",
  "5/8": "5/8 λ",
  "1/1": "1 λ",
};

export const DEFAULT_VF = 0.95;

export const LENGTH_HINT =
  "Näherungswert – Draht 3-5% länger schneiden und mit Antennenanalysator/SWR-Meter feinabstimmen. " +
  "Reale Resonanzlänge hängt von Drahtdurchmesser, Isolierung, Montagehöhe und Umgebung ab.";

export const BANDS_HINT =
  "Näherungswerte. Ein Draht ist resonant, wenn seine Länge einem Vielfachen der halben Wellenlänge entspricht.";

const FRACTION: Record<Lambda, number> = { "1/4": 0.25, "1/2": 0.5, "5/8": 0.625, "1/1": 1.0 };

// Wire length in meters. λ(m) = 300 / f. Standard shortening factor 0.95 for
// wire antennas (editable). Full-wave loop uses its own fixed formula 306.3 / f.
export function computeLength(
  freqMHz: number,
  lambda: Lambda,
  oneWhole: OneWhole | null,
  vf: number,
): number | null {
  if (!freqMHz || freqMHz <= 0) return null;
  if (lambda === "1/1" && oneWhole === "loop") return 306.3 / freqMHz;
  return (FRACTION[lambda] * 300 * vf) / freqMHz;
}

// --- Reverse: which amateur bands does a given wire length resonate on? ---

export type Band = { name: string; min: number; max: number };

// IARU Region 1 (Germany) band edges in MHz.
export const HAM_BANDS: Band[] = [
  { name: "160 m", min: 1.81, max: 2.0 },
  { name: "80 m", min: 3.5, max: 3.8 },
  { name: "60 m", min: 5.3515, max: 5.3665 },
  { name: "40 m", min: 7.0, max: 7.2 },
  { name: "30 m", min: 10.1, max: 10.15 },
  { name: "20 m", min: 14.0, max: 14.35 },
  { name: "17 m", min: 18.068, max: 18.168 },
  { name: "15 m", min: 21.0, max: 21.45 },
  { name: "12 m", min: 24.89, max: 24.99 },
  { name: "10 m", min: 28.0, max: 29.7 },
  { name: "6 m", min: 50.0, max: 52.0 },
  { name: "2 m", min: 144.0, max: 146.0 },
  { name: "70 cm", min: 430.0, max: 440.0 },
];

export type BandHit = { band: string; freqMHz: number; harmonic: number };

// A wire is resonant when its length equals n × (λ/2). The harmonic series of
// resonant frequencies is f_n = n × 150 × VF / L. Report every harmonic that
// lands inside an amateur band.
export function resonantBands(lengthM: number, vf: number): BandHit[] {
  if (!lengthM || lengthM <= 0) return [];
  const hits: BandHit[] = [];
  for (let n = 1; n <= 20; n++) {
    const f = (n * 150 * vf) / lengthM;
    if (f > 470) break;
    const band = HAM_BANDS.find((b) => f >= b.min && f <= b.max);
    if (band) hits.push({ band: band.name, freqMHz: f, harmonic: n });
  }
  return hits;
}

export function harmonicLabel(n: number): string {
  if (n === 1) return "λ/2 · Grundresonanz";
  if (n === 2) return "λ · 2. Harmonische";
  return `${n} × λ/2 · ${n}. Harmonische`;
}
