// Pure frequency parsing + lookup helpers for the bandplan. kHz internally.
import { BANDS, Band, EMCOMM_KHZ, PowerByClass, Segment } from "./data";

export type Unit = "kHz" | "MHz";

// Accepts comma OR dot as decimal separator; ignores spaces/thousand marks.
export function parseFrequencyKHz(text: string, unit: Unit): number | null {
  if (!text) return null;
  const cleaned = text.replace(/\s/g, "").replace(",", ".");
  if (!/^\d*\.?\d+$/.test(cleaned)) return null;
  const value = parseFloat(cleaned);
  if (!isFinite(value) || value <= 0) return null;
  const khz = unit === "MHz" ? value * 1000 : value;
  return Math.round(khz * 1000) / 1000; // keep up to 3 decimals (kHz)
}

export type HamMatch = { band: Band; segment: Segment };

const EPS = 1e-6;

export function findHamSegment(khz: number): HamMatch | null {
  for (const band of BANDS) {
    for (const segment of band.segments) {
      if (khz >= segment.from - EPS && khz <= segment.to + EPS) {
        return { band, segment };
      }
    }
  }
  return null;
}

export function isEmcomm(khz: number): boolean {
  return EMCOMM_KHZ.some((f) => Math.abs(f - khz) < 0.5);
}

// Turn the stored power into display rows. flat -> single "Alle Klassen" row.
export function powerRows(power?: PowerByClass): { label: string; value: string }[] {
  if (!power) return [];
  if (power.flat) return [{ label: "Alle Klassen", value: power.flat }];
  const rows: { label: string; value: string }[] = [];
  if (power.A) rows.push({ label: "Klasse A", value: power.A });
  if (power.E) rows.push({ label: "Klasse E", value: power.E });
  if (power.N) rows.push({ label: "Klasse N", value: power.N });
  return rows;
}

// Human range label for a segment (single spot freq vs range), German comma.
export function segmentRange(segment: Segment): string {
  const fmt = (n: number) => String(n).replace(".", ",");
  return segment.from === segment.to
    ? `${fmt(segment.from)} kHz`
    : `${fmt(segment.from)} – ${fmt(segment.to)} kHz`;
}
