import { useEffect } from 'react'
import { scroll } from '../state/scroll'

export function ScrollProgressBar() {
  useEffect(() => {
    let raf = 0
    const bar = document.getElementById('scroll-progress')
    if (!bar) return
    const loop = () => {
      const p = scroll.progress
      bar.style.setProperty('--scroll-progress', String(p))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <div id="scroll-progress" className="scroll-progress" role="progressbar" aria-label="Page scroll" aria-valuenow={0} />
}
