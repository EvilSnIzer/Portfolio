import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

export function Preloader({ progress, status, minMs = 1200, onDone }: { progress: number; status?: string; minMs?: number; onDone?: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const num = useRef<HTMLSpanElement>(null)
  const word = useRef<HTMLDivElement>(null)
  const shown = useRef(0)
  const start = useRef(performance.now())
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    let raf = 0, dead = false
    const tick = () => {
      if (dead) return
      shown.current += (progress - shown.current) * (progress > 0.94 ? 0.22 : 0.07)
      if (progress - shown.current < 0.003) shown.current = progress
      const pct = Math.min(1, shown.current)
      if (bar.current) bar.current.style.transform = `scaleX(${pct})`
      if (num.current) num.current.textContent = String(Math.round(pct * 100)).padStart(2, '0')
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { dead = true; cancelAnimationFrame(raf) }
  }, [progress])

  useEffect(() => {
    if (progress < 0.999) return
    const wait = Math.max(0, minMs - (performance.now() - start.current))
    const t = setTimeout(() => {
      setLeaving(true)
      const tl = gsap.timeline({ onComplete: () => { onDone?.(); try{ (window as any).ScrollTrigger?.refresh() }catch{} } })
      tl.to('.pl-word span', { yPercent: -110, opacity: 0, duration: 0.55, ease: 'power3.inOut', stagger: 0.04 }, 0)
      tl.to('.pl-meta', { opacity: 0, y: -10, duration: 0.35, ease: 'power2.in' }, 0)
      tl.to('.pl-bar-wrap', { opacity: 0, duration: 0.3 }, 0.15)
      tl.to('.pl-panel-top', { yPercent: -100, duration: 0.85, ease: 'expo.inOut' }, 0.28)
      tl.to('.pl-panel-bottom', { yPercent: 100, duration: 0.85, ease: 'expo.inOut' }, 0.28)
      tl.to(root.current, { opacity: 0, duration: 0.2 }, 1.0)
      tl.set(root.current, { display: 'none' }, 1.2)
    }, wait)
    return () => clearTimeout(t)
  }, [progress, minMs, onDone])

  return (
    <div ref={root} className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-ink" role="status" aria-live="polite" aria-label="Loading">
      <div className="pl-panel-top absolute inset-x-0 top-0 h-1/2 bg-ink" style={{ borderBottom: '1px solid var(--color-hairline)' }} aria-hidden />
      <div className="pl-panel-bottom absolute inset-x-0 bottom-0 h-1/2 bg-ink" aria-hidden />

      <header className="pl-meta relative z-10 flex items-center justify-between px-6 py-5 sm:px-10 sm:py-6">
        <span className="num text-[10px] tracking-[0.22em] uppercase text-paper-faint">Manan Sharma — Portfolio · 2026</span>
        <span className="num text-[10px] tracking-[0.18em] uppercase text-paper-faint hidden sm:block">Snizerr</span>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6">
        <div ref={word} className="pl-word overflow-hidden">
          <div className="flex items-baseline gap-3">
            <span className="inline-block display text-[18vw] leading-[0.82] tracking-[-0.055em] sm:text-[11vw] lg:text-[9vw]">MANAN</span>
            <span className="num text-[10px] tracking-[0.3em] uppercase text-accent hidden sm:inline">Portfolio</span>
          </div>
        </div>
        <p className="pl-meta num max-w-[36ch] text-center text-[11px] leading-[1.8] tracking-[0.12em] text-paper-dim uppercase">
          {status || 'Loading experience'}
        </p>
      </div>

      <footer className="pl-meta relative z-10 w-full px-6 pb-8 sm:px-10">
        <div className="flex items-end justify-between gap-6 mb-3">
          <p className="num text-[10px] uppercase tracking-[0.22em] text-paper-faint">Crafting intelligence into product</p>
          <p className="num text-[13px] tracking-[0.08em] text-paper tabular-nums"><span ref={num}>00</span><span className="text-paper-faint"> / 100</span></p>
        </div>
        <div className="pl-bar-wrap relative h-[2px] w-full overflow-hidden rounded-full bg-hairline">
          <div ref={bar} className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-paper" style={{ transform: 'scaleX(0)' }} />
        </div>
      </footer>
      {leaving && <span className="sr-only">Ready</span>}
    </div>
  )
}
