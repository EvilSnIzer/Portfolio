/**
 * The one palette for the whole page background, shared by the CSS backdrop and
 * the WebGL layers. Six stops, one per section, interpolated in document progress.
 *
 * It lives here rather than in either consumer on purpose: the aurora and the
 * particle tint used to be authored separately, which meant the atmosphere and
 * the volumetrics could drift into different colours on the same scroll position.
 * One table, two readers, no disagreement possible.
 */
export const STOPS = [
  { p: 0.0, a: [243, 166, 59], b: [26, 17, 6] }, // hero — amber on tar
  { p: 0.22, a: [232, 135, 58], b: [22, 16, 30] }, // about — ember into plum
  { p: 0.42, a: [240, 180, 92], b: [12, 24, 28] }, // skills — gold over ink-teal
  { p: 0.62, a: [217, 116, 59], b: [26, 16, 30] }, // projects — copper
  { p: 0.82, a: [243, 176, 96], b: [10, 22, 26] }, // timeline — amber over ice
  { p: 1.0, a: [255, 179, 92], b: [30, 18, 8] }, // contact — warm
]

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerp = (a, b, t) => a + (b - a) * t
export const rgbString = (c) => `rgb(${c[0] | 0} ${c[1] | 0} ${c[2] | 0})`

/** Interpolated {a, b} colour pair at document progress p. Smoothstepped so the
 *  crossfade between sections has no visible seam or snap. */
export function tintAt(p) {
  const x = clamp01(p)
  let i = 0
  while (i < STOPS.length - 2 && x > STOPS[i + 1].p) i++
  const s0 = STOPS[i]
  const s1 = STOPS[i + 1]
  const t = clamp01((x - s0.p) / Math.max(1e-6, s1.p - s0.p))
  const e = t * t * (3 - 2 * t)
  return {
    a: [lerp(s0.a[0], s1.a[0], e), lerp(s0.a[1], s1.a[1], e), lerp(s0.a[2], s1.a[2], e)],
    b: [lerp(s0.b[0], s1.b[0], e), lerp(s0.b[1], s1.b[1], e), lerp(s0.b[2], s1.b[2], e)],
  }
}
