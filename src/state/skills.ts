/**
 * Skill tag spring engine.
 *
 * Deliberately NOT a physics library: 24 tags on a critically damped spring
 * (k, c = 2√k) is smoother, smaller and cheaper than rapier — and "restrained,
 * not chaotic" is the actual brief.
 *
 * One rAF loop owns everything: it steps the springs, writes
 * `element.style.transform` directly (zero React renders), and mirrors the same
 * coordinates into `sceneState.nodes` so the WebGL layer can draw connective
 * lines through the exact points the DOM is using.
 *
 * Touch / reduced motion: springs are skipped, the layout is static, and the
 * repulsion force is off. The section then reads as a clean index.
 */
import { allSkills } from '../content/skills'
import { pointer } from './pointer'
import { sceneState } from '../scene/sceneState'

export type SkillNode = {
  i: number
  label: string
  group: string
  w: number
  /** normalised layout centre, 0-1 */
  nx: number
  ny: number
  x: number
  y: number
  vx: number
  vy: number
  seed: number
  el: HTMLElement | null
  /** measured size, used to bake centring into the transform */
  ew: number
  eh: number
  measured?: boolean
}

const GROUPS = ['AI / ML', 'Data / Quant', 'Software', 'Analytics']

export const skillNodes: SkillNode[] = (() => {
  const out: SkillNode[] = []
  let i = 0
  GROUPS.forEach((g, gi) => {
    const items = allSkills.filter((s) => s.group === g)
    const cols = Math.max(2, Math.ceil(Math.sqrt(items.length * 2.2)))
    items.forEach((s, within) => {
      const col = within % cols
      const row = Math.floor(within / cols)
      const rows = Math.ceil(items.length / cols)
      // Quadrant from the group, spread from the tier: core skills cluster near
      // the middle of their quadrant, satellites drift outward.
      const cx = 0.16 + (gi % 2) * 0.56
      const cy = 0.28 + Math.floor(gi / 2) * 0.44
      const spread = 0.055 + s.tier * 0.05
      out.push({
        i: i,
        label: s.label,
        group: g,
        w: s.w,
        nx: cx + (col - (cols - 1) / 2) * 0.135 + spread * (gi % 2 ? -1 : 1),
        ny: cy + (row - (rows - 1) / 2) * 0.115 + spread * (Math.floor(gi / 2) ? -1 : 1) * 0.6,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        seed: ((i * 37) % 100) / 100,
        el: null,
        ew: 96,
        eh: 30,
      } as SkillNode)
      i++
    })
  })
  return out
})()

export type SkillFieldOpts = { container: HTMLElement; staticMode?: boolean }

let container: HTMLElement | null = null
let running = false
let raf = 0
let last = 0
let staticMode = false
function empty() { return { width: 0, height: 0, top: 0, left: 0 } }

const REPEL_RADIUS = 155
const REPEL_FORCE = 240

function layout() {
  const r = container?.getBoundingClientRect()
  if (!r) return empty()
  return { width: r.width, height: r.height, top: r.top, left: r.left }
}

/** Call on resize: fonts/layout changed, so cached tag widths are stale. */
export function invalidateSkillMeasurement() {
  for (const n of skillNodes) n.measured = false
}

export function startSkillField(opts: SkillFieldOpts & { reduced?: boolean }) {
  container = opts.container
  staticMode = !!opts.staticMode || !!opts.reduced
  stopSkillField()
  const { width, height } = layout()
  for (const n of skillNodes) {
    n.x = n.nx * width
    n.y = n.ny * height
    n.vx = 0
    n.vy = 0
  }
  paint(0)
  if (staticMode) return
  running = true
  last = performance.now()
  raf = requestAnimationFrame(loop)
}

export function stopSkillField() {
  running = false
  cancelAnimationFrame(raf)
}

function loop() {
  if (!running || !container) return
  const now = performance.now()
  const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000))
  last = now
  step(dt, now / 1000)
  raf = requestAnimationFrame(loop)
}

function step(dt: number, t: number) {
  const { width, height, top, left } = layout()
  for (const n of skillNodes) {
    // The target itself drifts — that is the "floating" in the brief.
    const tx = n.nx * width + Math.sin(t * (0.32 + n.seed * 0.5) + n.seed * 8) * (6 + n.w * 8)
    const ty = n.ny * height + Math.cos(t * (0.27 + n.seed * 0.4) + n.seed * 4) * (5 + n.w * 7)

    const k = 40 * (0.65 + n.w * 0.5)
    const c = 2 * Math.sqrt(k)
    let ax = (tx - n.x) * k - n.vx * c
    let ay = (ty - n.y) * k - n.vy * c

    if (pointer.active) {
      const dx = n.x - (pointer.px - left)
      const dy = n.y - (pointer.py - top)
      const d = Math.hypot(dx, dy)
      if (d < REPEL_RADIUS && d > 0.001) {
        const f = (1 - d / REPEL_RADIUS) ** 2 * REPEL_FORCE
        ax += (dx / d) * f
        ay += (dy / d) * f
      }
    }

    n.vx += ax * dt
    n.vy += ay * dt
    n.x += n.vx * dt
    n.y += n.vy * dt

    const padX = 84
    const padY = 34
    if (n.x < padX) n.vx += (padX - n.x) * 14 * dt
    if (n.x > width - padX) n.vx -= (n.x - (width - padX)) * 14 * dt
    if (n.y < padY) n.vy += (padY - n.y) * 14 * dt
    if (n.y > height - padY) n.vy -= (n.y - (height - padY)) * 14 * dt
  }
  paint(t)
}

function paint(t: number) {
  const { width, height } = layout()
  if (!width || !height) return
  const nodes = (sceneState.nodes ||= [])
  for (const n of skillNodes) {
    // Centring is baked into the transform (one composited property, no
    // translate(-50%,-50%) fighting the spring, no layout write at paint time).
    if (n.el) {
      if (!n.measured) {
        n.ew = n.el.offsetWidth || n.ew
        n.eh = n.el.offsetHeight || n.eh
        n.measured = true
      }
      n.el.style.transform = `translate3d(${(n.x - n.ew / 2).toFixed(1)}px, ${(
        n.y - n.eh / 2
      ).toFixed(1)}px, 0)`
    }
    nodes[n.i] = {
      x: (n.x / width) * 2 - 1,
      y: -((n.y / height) * 2 - 1),
      group: n.group,
      seed: n.seed,
      t,
    }
  }
}
