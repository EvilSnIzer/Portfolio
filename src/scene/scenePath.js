/**
 * The signature interaction — and the only one on this site: a scroll-driven
 * camera path through the particle field. Keyframes are authored in document
 * progress (0 → 1 of the whole page), which is what keeps the 3D journey locked
 * to the DOM sections by construction: one timeline, one scrub, no listener drift.
 *
 *   p is deliberately not evenly spaced — it mirrors how much vertical space each
 * section actually occupies, so the long pinned Projects run holds the camera
 * nearly still while the sections before/after move it fast.
 *
 * World layout (the tube stays put around y≈-2 so the camera's descent reads as
 * parallax instead of a second fly-through):
 *   hero / core .......... y 0.3,  z -0.5
 *   skills field ......... y -0.9
 *   project planes ....... y -1.6, x -7 → +7
 *   timeline tube ........ y -2.5 → -5.5
 *   contact accent ....... y -7.0
 */
const V = {
  morph: 0,
  knotOpacity: 0,
  tube: 0,
  contact: 0,
  fieldFade: 1,
  focus: 0,
}

const kf = (p, pos, look, values) => ({
  p,
  pos,
  look,
  values: { ...V, ...values },
})

export const cameraPath = [
  kf(0.0, [0, 0.2, 10.4], [0, 0.15, -0.6], { fieldFade: 1, focus: 0 }),
  kf(0.085, [0.55, 0.1, 7.2], [0, 0.1, -0.6], { knotOpacity: 0.55, focus: 0.35 }),
  kf(0.2, [2.15, 0.75, 4.35], [-0.5, 0.15, -0.9], {
    morph: 0.3,
    knotOpacity: 1,
    fieldFade: 0.62,
    focus: 0.7,
  }),
  kf(0.335, [-2.0, -0.15, 3.5], [0.6, -0.6, -1.3], {
    morph: 0.78,
    knotOpacity: 0.92,
    fieldFade: 0.95,
    focus: 0.45,
  }),
  kf(0.47, [-1.5, -1.15, 7.3], [0, -1.35, -1.3], {
    morph: 1,
    knotOpacity: 0.7,
    fieldFade: 1,
    focus: 0.3,
  }),
  kf(0.6, [1.1, -0.75, 8.6], [0, -0.95, -1.4], {
    morph: 0.92,
    knotOpacity: 0.34,
    tube: 0.04,
    fieldFade: 1,
    focus: 0.22,
  }),
  kf(0.765, [-1.0, -2.55, 7.0], [0, -2.6, -1.5], {
    morph: 0.45,
    knotOpacity: 0.05,
    tube: 1,
    fieldFade: 0.85,
    focus: 0.5,
  }),
  kf(0.9, [0.45, -4.95, 6.3], [0, -5.5, -1.2], {
    morph: 0.12,
    tube: 1,
    contact: 0.65,
    fieldFade: 0.6,
    focus: 0.45,
  }),
  kf(1.0, [0, -6.5, 5.5], [0, -7.0, -0.9], {
    morph: 0,
    knotOpacity: 0,
    tube: 1,
    contact: 1,
    fieldFade: 0.42,
    focus: 0.3,
  }),
]

/** Mobile / reduced-motion fallback: no fly-through, ambient orbit only. */
export const ambientPath = {
  radius: 8.4,
  y: -0.6,
  /** radians per second — deliberately glacial. */
  speed: 0.05,
  look: [0, -1.1, -0.8],
}
