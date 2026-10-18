import { useEffect, useRef } from 'react'
import { getQuality } from '../state/quality'

export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (getQuality().reduced || window.matchMedia('(pointer: coarse)').matches) return
    let raf = 0
    let mx = 0, my = 0, rx = 0, ry = 0
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    const onEnter = (e: Event) => {
      const t = e.target as HTMLElement
      const hover = t.closest?.('a, button, [data-cursor-hover]') ? '1' : '0'
      if (ring.current) ring.current.dataset.hover = hover
    }
    const loop = () => {
      rx += (mx - rx) * 0.18
      ry += (my - ry) * 0.18
      if (dot.current) dot.current.style.transform = `translate3d(${mx}px,${my}px,0)`
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px,${ry}px,0) ${ring.current.dataset.hover==='1' ? 'scale(1.45)' : 'scale(1)'}`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onEnter, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onEnter)
    }
  }, [])

  return (
    <>
      <div ref={dot} className="cursor-dot" aria-hidden />
      <div ref={ring} className="cursor-ring" data-hover="0" aria-hidden />
    </>
  )
}
