import { useEffect, useRef } from 'react'
import gsap from 'gsap'

const STATS = [
  { value: 23, suffix: '', label: 'Public repositories shipped' },
  { value: 211, suffix: 'K+', label: 'Largest pipeline — trades processed' },
  { value: 6, suffix: '', label: 'Disciplines in one stack' },
  { value: 50, suffix: 'K+', label: 'Leads modelled in CRM intelligence' },
]

export function StatCounters() {
  const refs = useRef<(HTMLSpanElement|null)[]>([])
  useEffect(()=>{
    const els = refs.current.filter(Boolean) as HTMLElement[]
    if (!els.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if (!e.isIntersecting) return
        const el = e.target as HTMLElement
        const idx = Number(el.dataset.idx)
        const s = STATS[idx]
        const obj = { v: 0 }
        gsap.to(obj, { v: s.value, duration: 1.4, ease: 'power2.out', onUpdate(){
          el.textContent = Math.round(obj.v).toLocaleString() + s.suffix
        }, onComplete(){ el.textContent = s.value + s.suffix } })
        io.unobserve(el)
      })
    },{ threshold: 0.5 })
    els.forEach(el=> io.observe(el))
    return ()=> io.disconnect()
  },[])
  return (
    <ul className="grid grid-cols-2 gap-px border border-hairline bg-hairline lg:grid-cols-4">
      {STATS.map((s,i)=> (
        <li key={s.label} className="bg-ink-soft px-6 py-7 text-center">
          <span ref={el=>{refs.current[i]=el}} data-idx={i} className="display text-[32px] sm:text-[36px] leading-none">{s.value}{s.suffix}</span>
          <p className="num mt-2 text-[9px] uppercase leading-[1.5] tracking-[0.16em] text-paper-faint">{s.label}</p>
        </li>
      ))}
    </ul>
  )
}
