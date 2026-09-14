/**
 * The single source of truth for scroll.
 *
 * Architecture: Lenis owns native window scroll (it calls window.scrollTo).
 * GSAP ScrollTrigger therefore reads the *native* scrollbar, so pinning,
 * scroller positioning and horizontal sections behave exactly like a
 * non-smoothed site — there is no scrollerProxy math to keep in sync with
 * pinning (pinning + scrollerProxy is the classic source of rubber-banding).
 * A single rAF tick mirrors progress into the mutable store below, which the
 * camera rig, shaders and reveal timelines all read from.
 *
 *   Lenis ──▶ window.scrollY ──▶ ScrollTrigger ──▶ scroll.*  (mutable store)
 *                                     │                    │
 *                                     └── section tweens ┴──▶ R3F useFrame
 *
 * Nothing else computes scroll position: there is no second `scroll` listener
 * anywhere in the codebase.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { dampPointer } from './pointer'

gsap.registerPlugin(ScrollTrigger)

/** Order matters: the camera path keyframes are authored against this list. */
export const sections = [
  { id: 'hero', label: 'Intro', index: '00' },
  { id: 'about', label: 'About', index: '01' },
  { id: 'skills', label: 'Toolkit', index: '02' },
  { id: 'projects', label: 'Work', index: '03' },
  { id: 'timeline', label: 'Trajectory', index: '04' },
  { id: 'contact', label: 'Contact', index: '05' },
]

/** Mutable, render-free store. Read inside useFrame / tweens, never in render. */
export const scroll = {
  progress: 0, // 0 → 1 across the document
  y: 0, // raw px
  dy: 0, // px moved since the previous frame (signed, undamped)
  velocity: 0, // damped, −2.5 → 2.5
  max: 0, // scrollable height in px, so consumers never measure the document
  section: {}, // id → 0 → 1 progress *through* that section
  active: 'hero',
}

let lenis = null
let teardownFns = []
let booted = false

export async function initScroll({ smooth = true } = {}) {
  // Idempotent: StrictMode double-invokes effects, and two Lenis instances on one
  // document is a bug that shows up as rubber-banding rather than an error.
  if (booted) return { lenis }
  booted = true
  if (smooth) {
    // Dynamic import so reduced-motion visitors never download Lenis.
    const { default: Lenis } = await import('lenis')
    lenis = new Lenis({
      duration: 1.05,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.35,
      autoRaf: false,
    })
    document.documentElement.classList.add('lenis-active')
    lenis.on('scroll', (inst) => {
      const v = (inst.velocity ?? 0) / 40
      scroll.velocity += (gsap.utils.clamp(-2.5, 2.5, v) - scroll.velocity) * 0.2
    })
  }

  let raf = requestAnimationFrame(function loop(t) {
    lenis?.raf(t)
    tick()
    raf = requestAnimationFrame(loop)
  })

  const doc = () => document.documentElement
  const tick = () => {
    const d = doc()
    const max = Math.max(0, d.scrollHeight - window.innerHeight)
    const y = window.scrollY || d.scrollTop || 0
    scroll.dy = y - scroll.y
    scroll.y = y
    scroll.max = max
    scroll.progress = max > 0 ? gsap.utils.clamp(0, 1, y / max) : 0

    // Lenis only emits on *scroll*, so without this the velocity would latch at
    // its last value the moment you stopped — and anything that stretches, skews
    // or warps off velocity would stay deformed. Relax it back to zero per frame;
    // the 0.9 rate is tuned to match Lenis' own 0.2 attack so the two agree.
    scroll.velocity *= 0.9
    if (!lenis) {
      // No Lenis (reduced motion / native scroll): derive velocity from the delta
      // so the backdrop still has *some* signal instead of sitting dead flat.
      const v = gsap.utils.clamp(-2.5, 2.5, scroll.dy / 26)
      scroll.velocity += (v - scroll.velocity) * 0.3
    }
    dampPointer()
  }

  const onResize = () => ScrollTrigger.refresh()
  window.addEventListener('resize', onResize, { passive: true })
  // Re-measure once fonts land: display type at 12vw changes layout height.
  document.fonts?.ready.then(() => ScrollTrigger.refresh())

  teardownFns.push(() => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', onResize)
    lenis?.destroy()
    lenis = null
    document.documentElement.classList.remove('lenis-active')
  })

  tick()
  return { lenis }
}

export function teardownScroll() {
  teardownFns.forEach((fn) => fn())
  teardownFns = []
  ScrollTrigger.getAll().forEach((t) => t.kill())
}

export function scrollToSection(id) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) {
    lenis.scrollTo(el, { offset: -Math.round(window.innerHeight * 0.06), duration: 1.2 })
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

/**
 * Scroll to an absolute document offset. The Projects rail needs this: while it is
 * pinned, "next card" and drag both mean *move the page scroll by one pitch*, not
 * move the track. Same single funnel as `scrollToSection` so Lenis and native
 * scroll can never disagree about who owns the scrollbar.
 *
 * `immediate` skips smoothing — required while dragging, where an eased follow
 * would lag the pointer and feel like the page is made of rubber.
 */
export function scrollToY(y, { immediate = false } = {}) {
  const top = gsap.utils.clamp(0, scroll.max || document.documentElement.scrollHeight, y)
  if (lenis) {
    if (immediate) lenis.scrollTo(top, { immediate: true })
    else lenis.scrollTo(top, { duration: 0.9, easing: (t) => 1 - Math.pow(1 - t, 3) })
  } else {
    window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' })
  }
}

export function lockScroll(locked) {
  if (lenis) lenis[locked ? 'stop' : 'start']()
  document.documentElement.style.overflow = locked ? 'hidden' : ''
}
