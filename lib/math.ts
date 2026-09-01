export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Frame-rate independent lerp.
 *
 * A raw `lerp(a, b, 0.1)` per frame converges twice as fast at 120Hz as it
 * does at 60Hz; this keeps the feel identical on any display.
 *
 * @param smoothing fraction of the remaining distance left after one second.
 *                  Smaller = snappier. Typical range here is 0.0015 – 0.02.
 */
export const damp = (a: number, b: number, smoothing: number, dt: number) =>
  lerp(a, b, 1 - Math.pow(smoothing, dt * 60));
