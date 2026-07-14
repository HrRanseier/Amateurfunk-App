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
