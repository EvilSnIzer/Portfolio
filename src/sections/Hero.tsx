import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { hero, site } from '../content/site'
import { scroll, scrollToSection } from '../state/scroll'
import { useReveal, useSplitWords } from '../lib/motion'
import { getQuality } from '../state/quality'
import { MagneticButton } from '../components/MagneticButton'

const STACK = ['Python', 'PySpark', 'scikit-learn', 'React', 'SQL', 'Power BI', 'PyTorch', 'TypeScript', 'Docker', 'Databricks']

export function Hero({ ready }: { ready: boolean }) {
  const nameRef = useRef<HTMLHeadingElement>(null)
  const block = useRef<HTMLDivElement>(null)
  const reveal = useReveal(block, { threshold: 0.02 })
  const cueRef = useRef<HTMLDivElement>(null)
  const [roleIndex, setRoleIndex] = useState(0)
  useSplitWords(nameRef, { play: ready, delay: 0.14 })

  useEffect(() => {
    if (getQuality().reduced) return
    let t: number
    const onVis = () => {
      clearInterval(t)
      if (!document.hidden) t = window.setInterval(() => setRoleIndex((i) => (i + 1) % site.roles.length), 2600)
    }
    onVis()
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const el = cueRef.current; if (!el) return
      const p = Math.min(1, scroll.progress * 14)
      el.style.opacity = String(1 - p)
      el.style.transform = `translate3d(0, ${p * 28}px, 0)`
    }, 100)
    return () => clearInterval(id)
  }, [])

  return (
    <section id="hero" aria-labelledby="hero-title" className="relative flex min-h-[100svh] w-full flex-col overflow-hidden">
      {/* Mesh gradient — editorial premium */}
      <div aria-hidden className="hero-mesh" />
      {/* subtle grid overlay */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(var(--color-hairline) 1px, transparent 1px), linear-gradient(90deg, var(--color-hairline) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />

      <div ref={block} className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-end px-5 pb-8 sm:px-8 sm:pb-10">
        <div ref={reveal} className="contents">
          {/* Eyebrow — glass pill */}
          <div className="mb-6 inline-flex flex-wrap items-center gap-2 self-start" data-reveal>
            <span className="inline-flex items-center gap-2 border border-hairline bg-ink-soft/70 px-3 py-1.5 backdrop-blur-md">
              <span aria-hidden className="h-2 w-2 w-px bg-accent" />
              <span className="num text-[9px] uppercase tracking-[0.18em] text-paper-dim">{site.location}</span>
              <span className="text-paper-faint">·</span>
              <span className="num text-[9px] uppercase tracking-[0.16em] text-accent font-medium">{site.status.label}</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
              <span className="h-1.5 w-1.5 hidden" aria-hidden />
              <span className="num text-[8px] tracking-[0.16em] text-emerald-400 font-medium">Open to work</span>
            </span>
          </div>

          <h1 ref={nameRef} id="hero-title" className="text-paper" style={{ fontWeight: 750, letterSpacing: '-0.05em', lineHeight: 0.82 }}>
            <span className="display block text-[15vw] sm:text-[10.5vw] lg:text-[9.2vw] tracking-[-0.06em]" data-reveal>
              {site.name}
            </span>
            {/* underline accent */}
            <span className="mt-3 block h-[3px] w-[10%] max-w-[120px] rounded-full bg-accent" data-reveal aria-hidden />
            <span className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <span className="display-sm block text-[7vw] sm:text-[2.9vw] lg:text-[2.2vw] text-paper-dim font-light tracking-[-0.03em]" data-reveal>
                {site.tagline}
              </span>
              <span aria-hidden="true" className="num inline-flex h-[1.8em] items-center overflow-hidden border border-hairline bg-ink-soft/60 px-3 text-[10px] uppercase tracking-[0.18em] text-paper-dim backdrop-blur-sm">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={site.roles[roleIndex]}
                    initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="block"
                  >
                    {site.roles[roleIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
          </h1>

          {/* Value + CTAs — recruiter's 10-sec window */}
          <div className="mt-8 grid w-full gap-8 sm:mt-10 lg:grid-cols-[1.15fr_auto] lg:items-end">
            <div>
              <p className="max-w-[56ch] text-[16px] leading-[1.7] text-paper sm:text-[18px] font-light" data-reveal>
                {hero.line} <span className="text-paper-faint">—</span> <span className="text-paper-dim">{site.blurb}</span>
              </p>

              <div className="mt-8 flex flex-wrap gap-3" data-reveal>
                <MagneticButton
                  onClick={() => scrollToSection('projects')}
                  className="group inline-flex items-center gap-2.5 rounded-full bg-paper px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  View Projects
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-paper transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                </MagneticButton>
                <MagneticButton
                  href="/resume.pdf"
                  className="inline-flex items-center gap-2 rounded-full border border-hairline bg-ink-soft/80 px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.16em] text-paper backdrop-blur-md transition-all hover:border-paper/20 hover:bg-ink-raised hover:scale-[1.02] active:scale-[0.98]"
                >
                  Download Resume <span aria-hidden className="text-accent">↓</span>
                </MagneticButton>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4" data-reveal>
                <span className="num inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-paper-faint">
                  <span className="hidden sm:inline-flex h-6 w-6 items-center justify-center rounded-full border border-hairline text-[10px]">⌘</span> K for commands
                </span>
                <span className="h-3 w-px bg-hairline hidden sm:block" />
                <span className="num text-[9px] uppercase tracking-[0.18em] text-paper-faint">Scroll to explore ↓</span>
              </div>
            </div>

            {/* Stats — premium cards */}
            <div className="flex gap-3 sm:gap-4">
              {hero.metrics.map((m) => (
                <div key={m.label} data-reveal className="glass rounded-2xl px-5 py-4 sm:px-6 sm:py-5 min-w-[98px] text-center">
                  <p className="display text-[26px] sm:text-[30px] leading-none">{m.value}</p>
                  <p className="num mt-1.5 text-[8.5px] uppercase leading-[1.5] tracking-[0.14em] text-paper-faint">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tech marquee — editorial */}
      <div className="relative z-10 mt-8 marquee" aria-hidden>
        <div className="marquee-track">
          {[...STACK, ...STACK].map((t, i) => (
            <span key={i} className="num mx-6 inline-flex items-center gap-6 text-[11px] uppercase tracking-[0.2em] text-paper-faint/60">
              {t} <span className="h-1 w-1 hidden" />
            </span>
          ))}
        </div>
      </div>

      <div ref={cueRef} className="pointer-events-none absolute bottom-4 right-5 hidden items-center gap-3 sm:flex sm:right-8">
        <span className="num text-[9px] uppercase tracking-[0.22em] text-paper-faint/50">{site.tagline}</span>
      </div>
    </section>
  )
}
