import { useEffect, useRef } from 'react'
import { skillGroups } from '../content/skills'
import { skillsNote } from '../content/site'
import { skillNodes, startSkillField, stopSkillField, invalidateSkillMeasurement } from '../state/skills'
import { useReveal, useSectionProgress } from '../lib/motion'
import { getQuality } from '../state/quality'
import { OrbitSkills } from '../components/OrbitSkills'
import { StatCounters } from '../components/StatCounters'

export function Skills() {
  const ref = useSectionProgress('skills', { start: '0% 92%', end: '90% 30%' })
  const fieldRef = useRef<HTMLDivElement>(null)
  const inner = useReveal(ref, { stagger: 0.05 })

  useEffect(() => {
    const el = fieldRef.current; if (!el) return
    const q = getQuality()
    startSkillField({ container: el, reduced: q.reduced })
    const onResize = () => { invalidateSkillMeasurement(); startSkillField({ container: el, reduced: getQuality().reduced }) }
    window.addEventListener('resize', onResize)
    return () => { stopSkillField(); window.removeEventListener('resize', onResize) }
  }, [])

  return (
    <section id="skills" ref={ref} aria-labelledby="skills-title" className="relative mx-auto w-full max-w-[1600px] px-5 pb-40 pt-28 sm:px-8 sm:pb-56 sm:pt-36">
      <div ref={inner} className="relative z-10">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow" data-reveal>02 — Toolkit</p>
            <h2 id="skills-title" className="display-sm mt-5 text-[9vw] sm:text-[5vw] lg:text-[42px]" data-reveal>What I actually reach for</h2>
          </div>
          <p className="max-w-[38ch] text-[13.5px] leading-[1.7] text-paper-dim" data-reveal>{skillsNote}</p>
        </header>

        <div className="mt-14 grid gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
          {skillGroups.map((g, gi) => (
            <div key={g.group} className="bg-ink/85 px-5 py-6 backdrop-blur-[2px] sm:px-6" data-reveal>
              <h3 className="num flex items-baseline gap-2 text-[10px] uppercase tracking-[0.2em] text-paper">
                <span className="text-accent">{String(gi + 1).padStart(2, '0')}</span>{g.group}
              </h3>
              <dl className="mt-4 space-y-0">
                {g.items.map((it) => (
                  <div key={it.label} className="flex items-center justify-between gap-4 border-b border-hairline/70 py-2 last:border-0">
                    <dt className="text-[14px] text-paper-dim">{it.label}</dt>
                    <dd className="num text-[9px] uppercase tracking-[0.14em] text-paper-faint">{it.tier === 0 ? 'daily' : it.tier === 1 ? 'often' : 'as needed'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        {/* Animated counters */}
        <div className="mt-10" data-reveal><StatCounters /></div>

        {/* Orbiting radar — premium tech visualization instead of progress bars */}
        <div className="mt-14" data-reveal>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <h3 className="num text-[10px] uppercase tracking-[0.22em] text-paper">Orbit map — grouped by proficiency tier</h3>
            <p className="num text-[10px] uppercase tracking-[0.14em] text-paper-faint">Center = daily · Outer = as needed</p>
          </div>
          <div className="border border-hairline bg-ink-soft/60 p-6 sm:p-10 backdrop-blur-[2px]">
            <OrbitSkills />
          </div>
        </div>
      </div>

      {/* Floating field */}
      <div ref={fieldRef} aria-hidden="true" className="pointer-events-none absolute inset-0 top-[42%] h-[680px] select-none sm:h-[760px]">
        {skillNodes.map((n) => (
          <span key={n.i} ref={(el) => { skillNodes[n.i].el = el }}
            className="num absolute left-0 top-0 inline-flex items-center gap-1.5 whitespace-nowrap border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] transition-[opacity] duration-500"
            style={{ borderColor: 'rgba(242,242,240,0.13)', color: `rgba(242,242,240,${0.42 + n.w * 0.4})`, background: 'rgba(10,10,10,0.55)', willChange: 'transform', opacity: getQuality().reduced ? 0.6 : 1 }}>
            {n.label}
          </span>
        ))}
      </div>
    </section>
  )
}
