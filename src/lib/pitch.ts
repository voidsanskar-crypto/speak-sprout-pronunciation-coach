const MIN_HZ = 65;
const MAX_HZ = 420;

/** Finds the first strong period in a voiced window. Silence and noise return null. */
export function estimatePitch(buffer: Float32Array, sampleRate: number): number | null {
  const stride = Math.max(1, Math.floor(sampleRate / 12_000));
  const rate = sampleRate / stride;
  const length = Math.floor(buffer.length / stride);
  const minLag = Math.floor(rate / MAX_HZ);
  const maxLag = Math.min(Math.ceil(rate / MIN_HZ), length >> 1);
  if (maxLag <= minLag + 1) return null;

  let mean = 0;
  let energy = 0;
  for (let i = 0; i < length; i++) mean += buffer[i * stride]!;
  mean /= length;
  for (let i = 0; i < length; i++) energy += (buffer[i * stride]! - mean) ** 2;
  if (Math.sqrt(energy / length) < 0.008) return null;

  const values = new Float32Array(maxLag + 1);
  let strongest = 0;
  for (let lag = minLag - 1; lag <= maxLag; lag++) {
    let dot = 0;
    let left = 0;
    let right = 0;
    for (let i = 0; i < length - lag; i++) {
      const a = buffer[i * stride]! - mean;
      const b = buffer[(i + lag) * stride]! - mean;
      dot += a * b;
      left += a * a;
      right += b * b;
    }
    values[lag] = dot / (Math.sqrt(left * right) || 1);
    if (lag >= minLag) strongest = Math.max(strongest, values[lag]!);
  }

  for (let lag = minLag; lag < maxLag; lag++) {
    const value = values[lag]!;
    const before = values[lag - 1]!;
    const after = values[lag + 1]!;
    if (value < Math.max(0.7, strongest * 0.9) || value < before || value <= after) continue;
    const shift = (before - after) / (2 * (before - 2 * value + after)) || 0;
    return rate / (lag + shift);
  }
  return null;
}

export type PitchSample = { time: number; hz: number | null };

export function relativePitch(samples: readonly PitchSample[]) {
  const voiced = samples.flatMap(({ hz }) => (hz === null ? [] : [hz])).sort((a, b) => a - b);
  const median = voiced[Math.floor(voiced.length / 2)];
  return samples.map(({ time, hz }) => ({
    time,
    semitones: hz !== null && median !== undefined ? 12 * Math.log2(hz / median) : null,
  }));
}
