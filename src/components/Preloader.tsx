import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Branded preloader with a real progress bar.
 *
 * Two inputs, both honest:
 *   1. src/lib/assets.ts — byte-progress over the project images + font files
 *      (the actual payload of this page).
 *   2. drei's `useProgress` — merged in below via the callback the scene passes,
 *      so any R3F-managed loader work also moves the bar.
 *
 * The bar is time-averaged (not raw progress) so it can't jump to 100% and sit
 * there, and the whole thing refuses to leave before `minMs`.
 */
export function Preloader({
  progress,
  status,
  minMs = 1100,
  onDone,
}: {
  progress: number
  status?: string
  minMs?: number
  onDone?: () => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const num = useRef<HTMLSpanElement>(null)
  const shown = useRef(0)
  const start = useRef(performance.now())
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    let raf = 0
    let dead = false
    const tick = () => {
      if (dead) return
      // Ease the displayed value toward the real one; snap when very close.
      const target = progress
      shown.current += (target - shown.current) * (target > 0.94 ? 0.28 : 0.085)
      if (target - shown.current < 0.004) shown.current = target
      const pct = Math.min(1, shown.current)
      if (bar.current) bar.current.style.transform = `scaleX(${pct})`
      if (num.current) num.current.textContent = String(Math.round(pct * 100)).padStart(3, '0')
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      dead = true
      cancelAnimationFrame(raf)
    }
  }, [progress])

  useEffect(() => {
    if (progress < 0.999) return
    const wait = Math.max(0, minMs - (performance.now() - start.current))
    const t = setTimeout(() => {
      setLeaving(true)
      const tl = gsap.timeline({
        onComplete: () => {
          onDone?.()
          ScrollTrigger.refresh()
        },
      })
      tl.to('.pl-meta', { opacity: 0, y: -12, duration: 0.4, ease: 'power2.in' }, 0)
      tl.to('.pl-bar', { scaleX: 1, duration: 0.28, ease: 'power2.out' }, 0)
      tl.to(
        '.pl-panel',
        {
          height: '0%',
          duration: 0.95,
          ease: 'expo.inOut',
        },
        0.18
      )
      tl.to(root.current, { opacity: 0, duration: 0.25 }, 1.0)
      tl.set(root.current, { display: 'none' }, 1.25)
    }, wait)
    return () => clearTimeout(t)
  }, [progress, minMs, onDone])

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[80] flex flex-col justify-between overflow-hidden bg-ink px-6 py-6 sm:px-10 sm:py-8"
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
    >
      <div className="pl-panel absolute inset-0 bg-ink" aria-hidden />
      <header className="pl-meta relative z-10 flex items-start justify-between">
        <span className="eyebrow" style={{ color: 'var(--color-paper-dim)' }}>
          Manan&nbsp;Sharma
        </span>
        <span className="eyebrow">Portfolio · 2026</span>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-1">
        <div className="display text-[13vw] leading-[0.86] tracking-[-0.05em] sm:text-[8.5vw]">
          MS
        </div>
      </div>

      <footer className="pl-meta relative z-10 w-full">
        <div className="mb-3 flex items-end justify-between gap-6">
          <p className="num max-w-[52ch] text-[10px] uppercase tracking-[0.2em] text-paper-faint">
            {status || 'Loading assets'}
          </p>
          <p className="num shrink-0 text-[10px] tracking-[0.2em] text-paper-faint">
            <span ref={num}>000</span> / 100
          </p>
        </div>
        <div className="relative h-px w-full bg-hairline">
          <div
            ref={bar}
            className="absolute inset-y-0 left-0 w-full origin-left bg-paper"
            style={{ transform: 'scaleX(0)', height: '1px' }}
          />
        </div>
        {leaving ? <span className="sr-only">Ready</span> : null}
      </footer>
    </div>
  )
}
