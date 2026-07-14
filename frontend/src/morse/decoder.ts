import { MORSE_REVERSE } from "./morse";

// Pure, adaptive Morse decoder driven by tone/gap DURATIONS (milliseconds).
// It is decoupled from audio so it can be unit-tested by feeding synthetic
// on/off durations (see scripts/decoder-selftest.ts).
//
// Timing model (ITU): dot = 1u, dash = 3u, intra-char gap = 1u,
// inter-char gap = 3u, word gap = 7u. Classification boundaries: a pulse is a
// dash at >= 2u; a gap is a letter boundary at >= 2u and a word boundary at
// >= 5u. The reference unit `u` adapts continuously to the sender's speed.

export type DecoderOptions = {
  // Optional seed for the reference unit (ms), e.g. derived from the WPM slider.
  initialUnitMs?: number;
};

export class MorseDecoder {
  private unit: number;
  private seeded: boolean;
  private symbols: string;
  private text: string;
  private readonly onChange?: (text: string) => void;

  constructor(opts: DecoderOptions = {}, onChange?: (text: string) => void) {
    const seed = opts.initialUnitMs && opts.initialUnitMs > 0 ? opts.initialUnitMs : 60;
    this.unit = seed;
    this.seeded = !!(opts.initialUnitMs && opts.initialUnitMs > 0);
    this.symbols = "";
    this.text = "";
    this.onChange = onChange;
  }

  get transcript(): string {
    return this.text;
  }

  get pendingSymbols(): string {
    return this.symbols;
  }

  get unitMs(): number {
    return this.unit;
  }

  reset(): void {
    this.symbols = "";
    this.text = "";
    this.emit();
  }

  private emit(): void {
    if (this.onChange) this.onChange(this.text);
  }

  // Track the dot duration with an EMA so the reference unit follows the
  // sender. Snap down instantly when a clearly shorter pulse appears (we had
  // over-estimated because the first pulse was a dash).
  private adapt(dotEstimate: number): void {
    if (dotEstimate < this.unit * 0.6) this.unit = dotEstimate;
    else this.unit = this.unit * 0.8 + dotEstimate * 0.2;
  }

  pushTone(durationMs: number): void {
    if (durationMs <= 0) return;
    if (!this.seeded) {
      this.unit = durationMs;
      this.seeded = true;
    }
    const isDash = durationMs >= this.unit * 2;
    if (isDash) {
      this.symbols += "-";
      this.adapt(durationMs / 3);
    } else {
      this.symbols += ".";
      this.adapt(durationMs);
    }
  }

  private finalizeLetter(): void {
    if (this.symbols.length === 0) return;
    this.text += MORSE_REVERSE[this.symbols] ?? "";
    this.symbols = "";
    this.emit();
  }

  pushGap(durationMs: number): void {
    if (durationMs <= 0) return;
    if (durationMs < this.unit * 2) return; // intra-character gap
    this.finalizeLetter(); // letter boundary
    if (durationMs >= this.unit * 5) {
      if (this.text.length > 0 && !this.text.endsWith(" ")) {
        this.text += " ";
        this.emit();
      }
    }
  }

  // Flush the current letter (e.g. when listening stops).
  finish(): void {
    this.finalizeLetter();
  }
}
