/**
 * Shared mutable state between the DOM world and the WebGL world.
 *
 * One writer per field, all inside rAF. Nothing here triggers a React render —
 * components read these values in useFrame, which is exactly why the scroll
 * experience stays at one layout pass per frame.
 *
 *   scroll.js  ──writes──▶ scroll.section / scroll.progress
 *   CameraRig  ──writes──▶ sceneState.cam / look / values   (from one GSAP tween)
 *   Skills     ──writes──▶ sceneState.nodes (screen px, from DOM springs)
 *   Scene      ──reads───▶ everything above
 */
export const sceneState = {
  /** Damped camera transform — written by CameraRig, read by camera. */
  cam: { x: 0, y: 0, z: 9 },
  look: { x: 0, y: 0, z: 0 },
  /** Scroll-driven scalars, authored in scenePath.js. */
  values: {
    morph: 0, // torus knot → organic/neural
    knotOpacity: 1,
    tube: 0, // timeline curve draw progress
    tubeActive: 0, // how lit the tube is (fades out when far away)
    contact: 0, // contact accent object scale/energy
    fieldFade: 1, // particle field opacity
    focus: 0, // general "something is happening" energy for bloom
  },
  /** Timeline milestone activation, 0→1 each, written by ScrollTrigger tweens. */
  markers: [],
  /** Skill tag centres in CSS pixels, written by the DOM spring engine. */
  nodes: [],
  /** Horizontal gallery — the DOM writes, the WebGL plates follow. */
  projects: { x: 0, hovered: -1 },
  /** 0→1 pointer energy (fades interactions out when the mouse is idle). */
  pointerEnergy: 0,
  reduced: false,
  ready: false,
}

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
export const lerp = (a, b, t) => a + (b - a) * t
