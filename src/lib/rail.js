/**
 * The horizontal rail's arithmetic, kept pure and DOM-free on purpose.
 *
 * The Projects section is the only place on the site where a *scroll offset* has
 * to be converted into a *horizontal distance* and then back into a document
 * scroll position (for buttons, keys and drag). That round trip is where the pin
 * used to break — the travel was measured off a `display: contents` element,
 * which has no layout box, so it came back as 0, the pin got `end: '+=0'`, and
 * the rail had no scroll length at all. Putting the formulas here makes the
 * invariants that would have caught it testable with no browser at all.
 *
 * WHY FOCUS IS INDEX-PROPORTIONAL, NOT EDGE-ALIGNED
 * -------------------------------------------------
 * The obvious model — "scroll until card i's left edge hits the viewport's left
 * inset" — is wrong here, and the tests caught it. Five 400px cards at 40px pitch
 * inside a 1440px viewport leave 720px of travel, and the pitch positions for
 * cards 2/3/4 (880/1320/1760) all clamp to that same 720: the last three "next"
 * presses would not move a single pixel, because the rail physically ran out
 * before it could left-align those cards.
 *
 * Distributing the *available travel* evenly across the indices instead means
 * every step moves by travel/(n−1) and is therefore always visible; the final
 * card lands flush with the right edge by construction (travel is defined as
 * content − viewport), and the whole mapping stops depending on how many cards
 * happen to fit on a given screen. It also means one number — progress — is
 * enough to know the focused card, so the accent border, the depth treatment and
 * the HUD can never disagree with each other.
 */

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)
export const clamp01 = (v) => clamp(v, 0, 1)

/**
 * Total horizontal pixels the track can travel through the viewport.
 * `inset` is the track's own leading padding, counted on both ends because the
 * trailing one is what lets the last card clear the right edge.
 */
export function railTravel({ n, cardW, gap = 0, inset = 0, vpW }) {
  if (!(n > 0) || !(vpW > 0) || !(cardW > 0)) return 0
  const trackW = 2 * inset + n * cardW + (n - 1) * gap
  // A rail shorter than the viewport needs no travel; it just sits there.
  return Math.max(0, trackW - vpW)
}

/** Progress along the pin that puts card `i` in focus. */
export function progressForIndex(i, n) {
  if (!(n > 1)) return 0
  return clamp01(i / (n - 1))
}

/** The card in focus at this progress. */
export function indexForProgress(progress, n) {
  if (!(n > 1)) return 0
  return clamp(Math.round(clamp01(progress) * (n - 1)), 0, n - 1)
}

/** Track offset (px) for a given progress. */
export function offsetForProgress(progress, travel) {
  return clamp01(progress) * Math.max(0, travel)
}

/** Progress for a given track offset. Safe when travel is 0 (a short rail). */
export function progressForOffset(offset, travel) {
  return travel > 0 ? clamp01(offset / travel) : 0
}

/** The offset that puts card `i` in focus — used by the native touch rail. */
export function offsetForIndex(i, n, travel) {
  return offsetForProgress(progressForIndex(i, n), travel)
}

/**
 * How far card `i` is from focus, in *card steps*, saturated at ±1.6:
 * 0 = in focus, ±1 = its immediate neighbour, ±1.6 and beyond = fully retired.
 *
 * Measured in steps rather than pixels so the depth treatment means the same
 * thing on a 375px phone and a 2560px monitor — where a pixel measurement would
 * put four cards equally "in focus" at once. This is the only per-card visual
 * driver: CSS turns its sign into a parallax shift and its magnitude into dim,
 * scale and desaturation.
 */
export function focusOffset(i, n, progress) {
  if (!(n > 1)) return 0
  return clamp(i - clamp01(progress) * (n - 1), -1.6, 1.6)
}
