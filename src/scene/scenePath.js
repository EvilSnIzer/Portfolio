/**
 * The signature interaction — and the only one on this site: a scroll-driven camera
 * path through the particle field.
 *
 * Keyframes are authored against a SECTION and a fraction through it, not against a
 * fraction of the page. `src/lib/sectionAnchors` measures the real section bounds at
 * runtime and turns each anchor into an absolute progress value, so the choreography
 * survives a taller About, a different font size, a 2560px window with no rail
 * travel at all, and the pin's own spacing. Authoring absolute fractions did not.
 *
 * World layout (the tube stays put around y≈-2 so the camera's descent reads as
 * parallax instead of a second fly-through):
 *   hero / core .......... y 0.3,  z -0.5
 *   skills field ......... y -0.9
 *   project planes ....... y -1.6, x -7 → +7
 *   timeline tube ........ y -2.5 → -5.5
 *   contact accent ....... y -7.0
 *
 * Note the two `projects` keyframes: they hold the camera almost still for the
 * whole horizontal rail. That is deliberate — the plates and cards already carry
 * the motion there, and a flying camera would double it. Because a pinned
 * section's measured span includes its pin spacing, "0 → 1 through projects" is
 * automatically the long part, with no special case here.
 */
const V = {
  morph: 0,
  knotOpacity: 0,
  tube: 0,
  contact: 0,
  fieldFade: 1,
  focus: 0,
}

const kf = (sec, at, pos, look, values) => ({
  sec,
  at,
  pos,
  look,
  values: { ...V, ...values },
})

export const cameraPath = [
  kf('hero', 0.0, [0, 0.2, 10.4], [0, 0.15, -0.6], { fieldFade: 1, focus: 0 }),
  kf('hero', 0.6, [0.55, 0.1, 7.2], [0, 0.1, -0.6], { knotOpacity: 0.55, focus: 0.35 }),
  kf('about', 0.05, [2.15, 0.75, 4.35], [-0.5, 0.15, -0.9], {
    morph: 0.3,
    knotOpacity: 1,
    fieldFade: 0.62,
    focus: 0.7,
  }),
  kf('about', 0.85, [-2.0, -0.15, 3.5], [0.6, -0.6, -1.3], {
    morph: 0.78,
    knotOpacity: 0.92,
    fieldFade: 0.95,
    focus: 0.45,
  }),
  kf('skills', 0.1, [-1.5, -1.15, 7.3], [0, -1.35, -1.3], {
    morph: 1,
    knotOpacity: 0.7,
    fieldFade: 1,
    focus: 0.3,
  }),
  kf('projects', 0.0, [1.1, -0.75, 8.6], [0, -0.95, -1.4], {
    morph: 0.92,
    knotOpacity: 0.34,
    tube: 0.04,
    fieldFade: 1,
    focus: 0.22,
  }),
  kf('projects', 1.0, [0.15, -1.0, 8.1], [0, -1.1, -1.4], {
    morph: 0.8,
    knotOpacity: 0.18,
    tube: 0.4,
    fieldFade: 0.94,
    focus: 0.3,
  }),
  kf('timeline', 0.12, [-1.0, -2.55, 7.0], [0, -2.6, -1.5], {
    morph: 0.45,
    knotOpacity: 0.05,
    tube: 1,
    fieldFade: 0.85,
    focus: 0.5,
  }),
  kf('timeline', 0.9, [0.45, -4.95, 6.3], [0, -5.5, -1.2], {
    morph: 0.12,
    tube: 1,
    contact: 0.65,
    fieldFade: 0.6,
    focus: 0.45,
  }),
  kf('contact', 0.35, [0, -6.5, 5.5], [0, -7.0, -0.9], {
    morph: 0,
    knotOpacity: 0,
    tube: 1,
    contact: 1,
    fieldFade: 0.42,
    focus: 0.3,
  }),
  kf('contact', 1.0, [0, -6.9, 5.2], [0, -7.3, -0.9], {
    morph: 0,
    knotOpacity: 0,
    tube: 1,
    contact: 1,
    fieldFade: 0.34,
    focus: 0.24,
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
