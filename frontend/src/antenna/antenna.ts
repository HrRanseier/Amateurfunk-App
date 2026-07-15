// Pure antenna calculation logic (no React/RN imports) — unit-testable.

export type Lambda = "1/4" | "1/2" | "5/8" | "1/1";
export type OneWhole = "stretched" | "loop";

export type FeedPoint =
  | "vertical" // Vertikal mit Erdung/Radials
  | "dipole" // Mittig gespeist (Dipol)
  | "efhw" // Endgespeist (EFHW)
  | "endfed1l" // Endgespeist (1λ gestreckter Draht)
  | "loopCenter" // Unten mittig gespeist (horizontale Polarisation)
  | "loopCorner"; // Eckgespeist (vertikale Polarisation)

export const LAMBDA_LABEL: Record<Lambda, string> = {
  "1/4": "λ/4",
  "1/2": "λ/2",
  "5/8": "5/8 λ",
  "1/1": "1 λ",
};

export const FEED_LABEL: Record<FeedPoint, string> = {
  vertical: "Vertikal mit Erdung/Radials",
  dipole: "Mittig gespeist (Dipol)",
  efhw: "Endgespeist (EFHW)",
  endfed1l: "Endgespeist",
  loopCenter: "Unten mittig gespeist (horizontale Polarisation)",
  loopCorner: "Eckgespeist (vertikale Polarisation)",
};

export const DEFAULT_VF = 0.95;

export const RESULT_HINT =
  "Näherungswert – Draht 3-5% länger schneiden und mit Antennenanalysator/SWR-Meter feinabstimmen. " +
  "Reale Resonanzlänge hängt von Drahtdurchmesser, Isolierung, Montagehöhe und Umgebung ab.";

// Available feed points for a given lambda / one-whole variant.
// `locked` means a single, non-editable, pre-selected option.
export function feedConfig(
  lambda: Lambda,
  oneWhole: OneWhole | null,
): { options: FeedPoint[]; locked: boolean } {
  if (lambda === "1/4" || lambda === "5/8") return { options: ["vertical"], locked: true };
  if (lambda === "1/2") return { options: ["dipole", "efhw"], locked: false };
  // 1/1
  if (oneWhole === "stretched") return { options: ["endfed1l"], locked: true };
  return { options: ["loopCenter", "loopCorner"], locked: false }; // loop
}

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

// Recommended matching device (with feed-point impedance) for a feed point.
export function matchingDevice(feed: FeedPoint, lambda: Lambda): string {
  switch (feed) {
    case "vertical":
      return lambda === "5/8"
        ? "Meist kein Balun/Unun nötig – Fußpunktimpedanz ca. 35-60 Ω; ggf. Anpassspule zur Kompensation"
        : "Meist kein Balun/Unun nötig – Fußpunktimpedanz ca. 35-60 Ω";
    case "dipole":
      return "1:1 Balun (Mantelwellensperre) – Fußpunktimpedanz ca. 70-75 Ω";
    case "efhw":
    case "endfed1l":
      return "49:1 Unun – Fußpunktimpedanz mehrere kΩ";
    case "loopCenter":
      return "4:1 Balun – Fußpunktimpedanz ca. 100-120 Ω";
    case "loopCorner":
      return "1:1 Balun (Mantelwellensperre) – Fußpunktimpedanz ca. 50 Ω";
  }
}
