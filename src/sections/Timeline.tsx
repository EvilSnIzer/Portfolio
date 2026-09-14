import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { timeline } from '../content/timeline'
import { sceneState } from '../scene/sceneState'
import { useReveal, useSectionProgress } from '../lib/motion'
import { getQuality } from '../state/quality'

/**
 * 5/6 — TIMELINE.
 *
 * The 3D tube draws itself from the same `sceneState.values.tube` scalar that the
 * camera timeline writes. To keep the DOM in exact lockstep with the light-up
 * order, each row compares its chronological position against that one value in a
 * cheap class-toggle loop — no per-row ScrollTrigger (six triggers for six rows was
 * overkill, and triggers cannot be read *during* a scrub as cleanly as this).
 */
const times = timeline.map((m) => {
  const [y, mo] = m.date.split('-').map(Number)
  return y + ((mo || 1) - 1) / 12
})
const min = Math.min(...times)
const max = Math.max(...times)
const ts = times.map((t) => (max === min ? 0.5 : (t - min) / (max - min)))

export function Timeline() {
  const ref = useSectionProgress('timeline', { start: 'top bottom', end: 'bottom top' })
  const inner = useReveal(ref, { stagger: 0.05, base: 'left' })
  const rows = useRef<HTMLLIElement[]>([])

  useEffect(() => {
    const reduced = getQuality().reduced
    if (reduced) {
      rows.current.forEach((el) => el?.classList.add('lit'))
      return
    }
    let id = 0
    const loop = () => {
      const p = sceneState.values.tube ?? 0
      rows.current.forEach((el, i) => {
        if (!el) return
        const lit = p >= ts[i] - 0.015
        if (lit !== el.dataset.lit) el.dataset.lit = String(lit)
      })
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <section
      id="timeline"
      ref={ref}
      aria-labelledby="timeline-title"
      className="relative mx-auto w-full max-w-[1600px] px-5 py-28 sm:px-8 sm:py-36"
    >
      <style>{`
        [data-lit="true"] .tl-node { background: var(--color-accent); box-shadow: 0 0 16px 2px rgba(243,166,59,.42); border-color: var(--color-accent); }
        [data-lit="true"] .tl-year { color: var(--color-paper); }
        [data-lit="true"] .tl-title { color: var(--color-paper); }
        [data-lit="true"] .tl-rule { transform: scaleX(1); }
        .tl-node { transition: background .5s var(--ease-out-expo), box-shadow .5s ease, border-color .5s ease; }
        .tl-year, .tl-title { transition: color .5s ease; }
        .tl-rule { transform: scaleX(0); transform-origin: left; transition: transform .9s var(--ease-out-expo); }
      `}</style>

      <header className="flex flex-wrap items-end justify-between gap-6" ref={inner}>
        <div>
          <p className="eyebrow" data-reveal>
            04 — Trajectory
          </p>
          <h2 id="timeline-title" className="display-sm mt-5 text-[9vw] sm:text-[5.2vw] lg:text-[44px]" data-reveal>
            Where the work came from
          </h2>
        </div>
        <p className="max-w-[36ch] text-[13.5px] leading-[1.7] text-paper-dim" data-reveal>
          Marked by public repository activity — not a CV. Swap in your real dates and
          employers in <code className="num text-[12px] text-paper">src/content/timeline.ts</code>.
        </p>
      </header>

      <ol className="relative mt-16 border-l border-hairline pl-0 sm:mt-20">
        {timeline.map((m, i) => (
          <li
            key={`${m.year}-${m.title}`}
            ref={(el) => {
              if (el) rows.current[i] = el
            }}
            className="relative grid gap-4 py-7 pl-8 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-10 sm:pl-12"
          >
            <span
              aria-hidden
              className="tl-node absolute -left-[4.5px] top-[34px] h-[9px] w-[9px] rounded-full border border-hairline bg-ink"
            />
            <p className="tl-year num text-[11px] uppercase tracking-[0.2em] text-paper-faint">
              {m.date}
            </p>
            <div>
              <h3 className="tl-title text-[20px] leading-[1.2] text-paper-dim sm:text-[23px]" style={{ letterSpacing: '-0.02em', fontWeight: 600 }}>
                {m.title}
              </h3>
              <p className="num mt-1.5 text-[10px] uppercase tracking-[0.18em] text-paper-faint">{m.org}</p>
              <p className="mt-3 max-w-[62ch] text-[14.5px] leading-[1.7] text-paper-dim/90">{m.body}</p>
              {m.tags?.length ? (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {m.tags.map((t) => (
                    <li
                      key={t}
                      className="num border border-hairline px-2 py-[3px] text-[9px] uppercase tracking-[0.14em] text-paper-faint"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              ) : null}
              <motion.span aria-hidden className="tl-rule mt-6 block h-px bg-hairline" />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
