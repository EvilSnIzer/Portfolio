import { useEffect, useRef, type CSSProperties } from 'react'
import { scroll } from '../state/scroll'
import { getQuality } from '../state/quality'
import { damp } from '../lib/damp'
import { tintAt, rgbString as rgb } from '../lib/palette'

/**
 * The scroll *background* — the layer the whole page sits on, painted under the
 * WebGL canvas (both are fixed z-0; this one comes first in the DOM, so the
 * additive particles and streaks draw over it).
 *
 * It replaces the old flat vignette with a scroll-reactive depth field:
 *
 *   · two aurora masses that drift, rotate and *stretch* against scroll velocity
 *   · a conic "silk" that unwinds once across the document
 *   · a perspective grid that slides toward the viewer — the layer that makes the
 *     page feel like it is travelling rather than paging
 *   · a palette interpolated between six stops, one per section, so the colour of
 *     the room changes as you descend
 *
 * Why CSS compositing rather than another shader pass: it costs zero GL, it
 * survives `?no3d=1`, mobile and a lost WebGL context identically, and
 * transform/opacity stay on the compositor. The canvas owns the volumetric part;
 * this owns the atmospheric part.
 *
 * The palette comes from lib/palette so the atmosphere and the volumetrics are the
 * same colour at the same scroll position by construction, not by discipline.
 *
 * One rAF, a handful of custom properties, and nothing written at all when the
 * values have not moved — a style write nobody can see is one nobody should make.
 */
export function ScrollBackdrop() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const reduced = getQuality().reduced
    if (reduced) el.dataset.reduced = '1'

    let raf = 0
    let sp = -1
    let sv = 0
    let grid = -1
    let first = true
    let tintKey = ''

    const loop = () => {
      raf = requestAnimationFrame(loop)
      const target = scroll.progress
      const v = reduced ? 0 : scroll.velocity

      // Damped: the backdrop trails the page by a few frames, which is what reads
      // as depth instead of a CSS animation bolted onto the scrollbar.
      if (sp < 0) sp = target
      sp += (target - sp) * damp(5.2, 1 / 60)
      sv += (v - sv) * damp(6.5, 1 / 60)

      // `first` matters: the browser can restore a mid-page scroll position on load,
      // where nothing is "moving", and an epsilon gate alone would leave the
      // backdrop painted with the hero values until the user scrolled.
      const alive = first || Math.abs(target - sp) > 0.0006 || Math.abs(sv) > 0.012
      first = false
      if (alive) {
        el.style.setProperty('--sp', sp.toFixed(4))
        el.style.setProperty('--sv', sv.toFixed(3))
        // Squared so the stretch answers speed, not direction.
        el.style.setProperty('--sv2', (sv * sv).toFixed(4))
      }

      // Grid travel uses raw pixels, so the floor keeps sliding through the pinned
      // Projects run where document progress is deliberately almost still.
      const g = (scroll.y * 0.16) % 60
      if (Math.abs(g - grid) > 0.18) {
        grid = g
        el.style.setProperty('--grid', g.toFixed(2) + 'px')
      }

      const t = tintAt(target)
      const key = `${t.a[0] | 0}:${t.b[0] | 0}`
      if (key !== tintKey) {
        tintKey = key
        el.style.setProperty('--tint-a', rgb(t.a))
        el.style.setProperty('--tint-b', rgb(t.b))
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="backdrop"
      style={
        {
          // These are the hero-section values, so the first paint is already
          // correct instead of a flash of flat grey before the loop's first frame.
          ['--sp' as string]: '0',
          ['--sv' as string]: '0',
          ['--sv2' as string]: '0',
          ['--grid' as string]: '0px',
          ['--tint-a' as string]: 'rgb(243 166 59)',
          ['--tint-b' as string]: 'rgb(26 17 6)',
        } as CSSProperties
      }
    >
      {/* Deep base: replaces the flat body fill with an ambient gradient floor. */}
      <div className="backdrop-base" />
      <div className="backdrop-silk" />
      <div className="backdrop-aurora a" />
      <div className="backdrop-aurora b" />
      <div className="backdrop-grid" />
      {/* Edge burn: keeps the aurora from lifting the corners where type sits. */}
      <div className="backdrop-burn" />
    </div>
  )
}
