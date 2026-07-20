// Pure DSP helpers (no React / RN imports) so they are unit-testable in Node.

// Goertzel single-bin power detector — efficient because we only care about one
// target frequency (the CW tone). Returns normalized power for `targetFreq`.
export function goertzelPower(samples: Float32Array, targetFreq: number, sampleRate: number): number {
  const n = samples.length;
  if (n === 0) return 0;
  const k = Math.round((n * targetFreq) / sampleRate);
  const omega = (2 * Math.PI * k) / n;
  const cosine = Math.cos(omega);
  const coeff = 2 * cosine;
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < n; i++) {
    const s0 = samples[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  const power = s1 * s1 + s2 * s2 - coeff * s1 * s2;
  return Math.max(power, 0) / n;
}

// Simple RMS amplitude (0..~1) for a level meter fallback.
export function rmsLevel(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / Math.max(samples.length, 1));
}

// Peak tone magnitude across a frequency band. Robust to the exact CW pitch:
// scans Goertzel bins from loHz..hiHz and returns the strongest normalized
// magnitude (sqrt of power) plus the bin frequency. Used so the operator does
// NOT have to tune the precise sidetone frequency to detect an incoming tone —
// a single fixed bin (~±12 Hz) almost never matches a real received signal.
export function bandTonePeak(
  samples: Float32Array,
  sampleRate: number,
  loHz: number,
  hiHz: number,
): { mag: number; freq: number } {
  const n = samples.length;
  if (n === 0) return { mag: 0, freq: loHz };
  const binHz = sampleRate / n;
  const kLo = Math.max(1, Math.floor(loHz / binHz));
  const kHi = Math.min((n >> 1) - 1, Math.ceil(hiHz / binHz));
  let best = 0;
  let bestK = kLo;
  for (let k = kLo; k <= kHi; k++) {
    const omega = (2 * Math.PI * k) / n;
    const coeff = 2 * Math.cos(omega);
    let s1 = 0;
    let s2 = 0;
    for (let i = 0; i < n; i++) {
      const s0 = samples[i] + coeff * s1 - s2;
      s2 = s1;
      s1 = s0;
    }
    const power = Math.max(s1 * s1 + s2 * s2 - coeff * s1 * s2, 0) / n;
    if (power > best) {
      best = power;
      bestK = k;
    }
  }
  return { mag: Math.sqrt(best), freq: bestK * binHz };
}
