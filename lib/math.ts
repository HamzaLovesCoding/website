export const clamp = (v: number, min = 0, max = 1) =>
  v < min ? min : v > max ? max : v;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Frame-rate independent lerp. A raw `lerp(a, b, 0.1)` per frame moves twice
 * as fast at 120Hz as at 60Hz; this keeps the feel identical on any display.
 */
export const damp = (a: number, b: number, smoothing: number, dt: number) =>
  lerp(a, b, 1 - Math.pow(smoothing, dt * 60));

export const map = (
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) => outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);

export const clampedMap = (
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) => clamp(map(v, inMin, inMax, outMin, outMax), Math.min(outMin, outMax), Math.max(outMin, outMax));
