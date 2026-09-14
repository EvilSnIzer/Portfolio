/**
 * Section anchors: the bridge between "authored choreography" and "the document
 * that actually exists today".
 *
 * Why this exists — the camera path used to be authored as absolute fractions of
 * document progress (0.765 → the timeline's tube lights up). That silently couples
 * the choreography to the total page height, and the page height is *not* stable:
 * the pinned Projects run contributes its own travel as pin spacing, which depends
 * on viewport width (five 400px cards overflow a 1440px window by 720px and a
 * 2560px window by nothing at all), and every section's height moves with font
 * size, copy and wrap. Fixing the rail made that worse on purpose — the section now
 * has real scroll length — so the path is authored against sections instead, and
 * measured at runtime. A keyframe says "60% through About", and it stays there no
 * matter how tall the page turns out to be.
 *
 * Measured from section tops rather than element heights on purpose: `end` is the
 * *next* section's top, so a pinned section's span automatically includes its pin
 * spacing. That is exactly what makes "hold the camera nearly still through the
 * whole horizontal rail" fall out of the geometry instead of needing a special case.
 */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

/**
 * @param {string[]} ids  section ids, in document order
 * @param {Document} [doc]
 * @returns {{ max: number, anchors: Record<string, {start:number, span:number}> }}
 */
export function measureAnchors(ids, doc = typeof document !== 'undefined' ? document : null) {
  const anchors = {}
  if (!doc) return { max: 1, anchors }
  const win = doc.defaultView || window
  const height = doc.documentElement?.scrollHeight || 0
  const max = Math.max(1, height - (win.innerHeight || 0))
  const y = win.scrollY || doc.documentElement?.scrollTop || 0

  const tops = ids.map((id) => {
    const el = doc.getElementById?.(id)
    if (!el) return null
    const box = el.getBoundingClientRect()
    // Round-trip through the viewport so this stays correct while a pin has the
    // page transformed; offsetTop would ignore the pin spacer entirely.
    return box.top + y
  })

  ids.forEach((id, i) => {
    const raw = tops[i]
    if (raw == null) {
      // A section that is not in the DOM gets no range at all. Giving it the whole
      // page (start 0, span 1) would spread its keyframes across every other
      // section, which is a much worse failure than simply not animating.
      anchors[id] = { start: 0, span: 0 }
      return
    }
    // Progress can never exceed 1, and a section shorter than the viewport sits
    // "below the end" of the scroll range — clamp, or its keyframes would be
    // authored against scroll distance that does not exist.
    const start = Math.min(raw, max)
    // Next *measured* section top (skipping any section that failed to resolve),
    // falling back to the bottom of the document for the last one.
    let end = null
    for (let j = i + 1; j < tops.length && end == null; j++) end = tops[j]
    if (end == null) end = height
    end = Math.max(start + 1, Math.min(end, max))
    const span = Math.max(1, end - start)
    anchors[id] = { start: start / max, span: span / max }
  })

  return { max, anchors }
}

/**
 * Absolute document progress for "fraction `at` through section `id`".
 * Monotonic by construction within a section; across sections it inherits whatever
 * order the ids were measured in, which is the DOM order the caller passes.
 */
export function progressAt(anchors, id, at = 0) {
  const a = anchors?.[id]
  if (!a) return 0
  return clamp01(a.start + clamp01(at) * a.span)
}

/** Sort + de-duplicate keyframe times so a GSAP timeline never gets a negative segment. */
export function sortedTimes(times) {
  const out = []
  for (const t of times.slice().sort((a, b) => a - b)) {
    if (!out.length || t - out[out.length - 1] > 1e-4) out.push(t)
    else out.push(out[out.length - 1] + 1e-4)
  }
  // A GSAP timeline's positions must be finite and non-decreasing.
  return out.map((t) => (Number.isFinite(t) ? Math.max(0, t) : 0))
}
