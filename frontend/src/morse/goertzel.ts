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

// Band tone analysis, robust to the exact CW pitch AND to broadband transients
// (tapping the phone / knocks). Applies a Hann window (curbs spectral leakage so
// a tone falling between bins is not split below threshold), scans Goertzel bins
// loHz..hiHz and returns the strongest bin magnitude, its frequency, and a
// TONALITY score = peakPower / meanBandPower. A pure tone concentrates its
// energy in one bin => high tonality; a broadband thump spreads energy over the
// whole band => tonality ~1, so it can be rejected.
export function bandToneStats(
  samples: Float32Array,
  sampleRate: number,
  loHz: number,
  hiHz: number,
): { mag: number; freq: number; tonality: number } {
  const n = samples.length;
  if (n < 2) return { mag: 0, freq: loHz, tonality: 0 };
  const w = new Float32Array(n);
  const norm = (2 * Math.PI) / (n - 1);
  for (let i = 0; i < n; i++) w[i] = samples[i] * (0.5 - 0.5 * Math.cos(norm * i));
  const binHz = sampleRate / n;
  const kLo = Math.max(1, Math.floor(loHz / binHz));
  const kHi = Math.min((n >> 1) - 1, Math.ceil(hiHz / binHz));
  let best = 0;
  let bestK = kLo;
  let sum = 0;
  let count = 0;
  for (let k = kLo; k <= kHi; k++) {
    const omega = (2 * Math.PI * k) / n;
    const coeff = 2 * Math.cos(omega);
    let s1 = 0;
    let s2 = 0;
    for (let i = 0; i < n; i++) {
      const s0 = w[i] + coeff * s1 - s2;
      s2 = s1;
      s1 = s0;
    }
    const power = Math.max(s1 * s1 + s2 * s2 - coeff * s1 * s2, 0) / n;
    sum += power;
    count++;
    if (power > best) {
      best = power;
      bestK = k;
    }
  }
  const mean = count > 0 ? sum / count : 0;
  return { mag: Math.sqrt(best), freq: bestK * binHz, tonality: best / (mean + 1e-9) };
}
