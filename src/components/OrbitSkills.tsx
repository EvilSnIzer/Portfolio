import { useEffect, useRef } from 'react'
import { getQuality } from '../state/quality'

const ORBITS = [
  { r: 92, speed: 0.18, items: ['Python','PySpark','SQL'] },
  { r: 158, speed: -0.12, items: ['scikit-learn','Spark SQL','React'] },
  { r: 224, speed: 0.08, items: ['Time Series','Parquet','Docker','Power BI'] },
]

export function OrbitSkills() {
  const wrap = useRef<HTMLDivElement>(null)
  const reduced = getQuality().reduced

  useEffect(()=>{
    if (reduced) return
    let raf=0, t=0
    const els = wrap.current?.querySelectorAll<HTMLElement>('[data-orbit]') || []
    const loop = () => {
      t += 0.008
      els.forEach(el=>{
        const orbit = Number(el.dataset.orbit)
        const idx = Number(el.dataset.idx)
        const total = Number(el.dataset.total)
        const cfg = ORBITS[orbit]
        const angle = (t * cfg.speed * 60) + (idx/total)*Math.PI*2
        const x = Math.cos(angle)*cfg.r
        const y = Math.sin(angle)*cfg.r * 0.72 // ellipse
        el.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return ()=> cancelAnimationFrame(raf)
  },[reduced])

  return (
    <div className="orbit-wrap">
      {/* radar rings + crosshair */}
      <svg viewBox="0 0 560 560" className="absolute inset-0 h-full w-full" aria-hidden>
        <circle cx="280" cy="280" r="90" fill="none" stroke="var(--color-hairline)" strokeWidth="1" opacity=".9"/>
        <circle cx="280" cy="280" r="160" fill="none" stroke="var(--color-hairline)" strokeWidth="1" opacity=".7"/>
        <circle cx="280" cy="280" r="226" fill="none" stroke="var(--color-hairline)" strokeWidth="1" opacity=".5" strokeDasharray="6 6"/>
        <line x1="280" y1="40" x2="280" y2="520" stroke="var(--color-hairline)" opacity=".35"/>
        <line x1="40" y1="280" x2="520" y2="280" stroke="var(--color-hairline)" opacity=".35"/>
        <circle cx="280" cy="280" r="4" fill="var(--color-accent)"/>
      </svg>
      {/* centre label */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="num text-[10px] uppercase tracking-[0.22em] text-accent">Core</p>
        <p className="display-sm text-[15px] leading-none">Stack</p>
      </div>
      {/* orbiting chips */}
      <div ref={wrap} className="absolute inset-0">
        {ORBITS.map((o, oi)=> o.items.map((label,j)=> (
          <span
            key={label}
            data-orbit={oi}
            data-idx={j}
            data-total={o.items.length}
            className="num absolute left-1/2 top-1/2 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]"
            style={{
              borderColor: 'color-mix(in oklab, var(--color-accent) 28%, var(--color-hairline))',
              background: 'var(--color-ink-soft)',
              color: 'var(--color-paper-dim)',
            }}
          >
            {label}
          </span>
        )))}
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 num text-[9px] uppercase tracking-[0.2em] text-paper-faint whitespace-nowrap">Hover tags orbit · grouped by tier</div>
    </div>
  )
}
