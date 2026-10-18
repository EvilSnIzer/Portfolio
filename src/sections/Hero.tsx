import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { hero, site } from '../content/site'
import { scroll, scrollToSection } from '../state/scroll'
import { useReveal, useSplitWords } from '../lib/motion'
import { getQuality } from '../state/quality'
import { MagneticButton } from '../components/MagneticButton'

export function Hero({ ready }: { ready: boolean }) {
  const nameRef = useRef<HTMLHeadingElement>(null)
  const block = useRef<HTMLDivElement>(null)
  const reveal = useReveal(block, { threshold: 0.02 })
  const cueRef = useRef<HTMLDivElement>(null)
  const [roleIndex, setRoleIndex] = useState(0)
  useSplitWords(nameRef, { play: ready, delay: 0.12 })

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
      el.style.transform = `translate3d(0, ${p * 26}px, 0)`
    }, 100)
    return () => clearInterval(id)
  }, [])

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative flex h-[100svh] min-h-[560px] w-full flex-col justify-end px-5 pb-14 sm:px-8 sm:pb-20"
    >
      {/* subtle parallax accent line */}
      <div aria-hidden className="pointer-events-none absolute left-0 top-[14%] hidden h-px w-[22vw] bg-gradient-to-r from-transparent via-accent/30 to-transparent lg:block" />

      <div ref={block} className="mx-auto w-full max-w-[1600px]" data-hero>
        <div ref={reveal} className="contents">
          <p className="eyebrow mb-6 flex items-center gap-3" data-reveal>
            <span aria-hidden className="inline-block h-[5px] w-[5px] rounded-full" style={{ background: 'var(--color-accent)' }} />
            {site.location}
            <span className="text-paper-faint/60">·</span>
            <span>{site.status.label}</span>
            <span className="hidden items-center gap-1.5 sm:inline-flex ml-2 rounded-full border border-hairline px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
              <span className="num text-[8px] tracking-[0.16em]">Available</span>
            </span>
          </p>

          <h1 ref={nameRef} id="hero-title" className="text-paper" style={{ fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.86 }}>
            <span className="display block text-[16.5vw] sm:text-[11.4vw] lg:text-[9.6vw]" data-reveal>{site.name}</span>
            <span className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-1 sm:mt-6">
              <span className="display-sm block text-[8vw] text-paper-dim sm:text-[3.4vw] lg:text-[2.6vw]">{site.tagline}</span>
              <span aria-hidden="true" className="num inline-flex h-[1.6em] items-center overflow-hidden text-[10px] uppercase tracking-[0.2em] text-paper-faint sm:text-[11px]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={site.roles[roleIndex]}
                    initial={{ y: '110%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-110%', opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="block"
                  >
                    {site.roles[roleIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
          </h1>

          {/* Value proposition + CTAs — the recruiter's 10-second window */}
          <div className="mt-8 grid w-full gap-8 sm:mt-10 lg:grid-cols-[1.1fr_auto] lg:items-end">
            <div>
              <p className="max-w-[54ch] text-[15px] leading-[1.7] text-paper-dim sm:text-[17px]" data-reveal>{hero.line}</p>
              <p className="num mt-3 max-w-[52ch] text-[11px] leading-[1.6] tracking-[0.04em] text-paper-faint" data-reveal>
                {site.blurb}
              </p>
              {/* Two CTAs */}
              <div className="mt-7 flex flex-wrap gap-3" data-reveal>
                <MagneticButton
                  onClick={() => scrollToSection('projects')}
                  className="num inline-flex items-center gap-2 bg-paper px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:bg-paper/90"
                >
                  View Projects <span aria-hidden>↗</span>
                </MagneticButton>
                <MagneticButton
                  href="/resume.pdf"
                  className="num inline-flex items-center gap-2 border border-hairline bg-ink-soft/80 px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-paper backdrop-blur-[2px] transition-colors hover:border-paper/40 hover:text-paper"
                >
                  Download Resume <span aria-hidden>↓</span>
                </MagneticButton>
              </div>
              <p className="num mt-3 text-[9px] uppercase tracking-[0.18em] text-paper-faint">⌘K for command palette · Scroll to explore</p>
            </div>
            <ul className="flex flex-wrap gap-x-10 gap-y-4">
              {hero.metrics.map((m) => (
                <li key={m.label} data-reveal>
                  <p className="display text-[28px] leading-none sm:text-[34px]">{m.value}</p>
                  <p className="num mt-2 text-[9.5px] uppercase tracking-[0.18em] text-paper-faint">{m.label}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div ref={cueRef} className="pointer-events-none absolute inset-x-5 bottom-5 flex items-center justify-between sm:inset-x-8 sm:bottom-8">
        <button
          type="button" onClick={() => scrollToSection('about')}
          className="num pointer-events-auto inline-flex items-center gap-3 text-[9.5px] uppercase tracking-[0.24em] text-paper-faint transition-colors hover:text-paper"
        >
          <motion.span aria-hidden animate={{ y: [0, 7, 0] }} transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }} className="block h-6 w-px bg-paper-faint" />
          {hero.scrollCue}
        </button>
        <p className="num hidden text-[9.5px] uppercase tracking-[0.24em] text-paper-faint sm:block">{site.tagline}</p>
      </div>
    </section>
  )
}
