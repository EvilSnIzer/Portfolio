import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Konami + click-easter-egg: click the MS logo 5 times quickly
export function EasterEgg() {
  const [show, setShow] = useState(false)
  const [konamiPos, setKonamiPos] = useState(0)

  useEffect(()=>{
    const code = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']
    const onKey = (e: KeyboardEvent) => {
      const expected = code[konamiPos]
      if (e.key === expected) {
        const next = konamiPos + 1
        if (next === code.length) { setShow(true); setKonamiPos(0); setTimeout(()=> setShow(false), 3200) }
        else setKonamiPos(next)
      } else setKonamiPos(0)
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  }, [konamiPos])

  useEffect(()=>{
    let clicks=0, timer:any
    const onClick = (e: Event)=>{
      const t = e.target as HTMLElement
      if (!t.closest('a[href=\"#hero\"]') && !t.textContent?.includes('MS')) return
      clicks++
      clearTimeout(timer)
      timer = setTimeout(()=> clicks=0, 1200)
      if (clicks>=5) { setShow(true); clicks=0; setTimeout(()=> setShow(false), 3200) }
    }
    document.addEventListener('click', onClick)
    return ()=> document.removeEventListener('click', onClick)
  },[])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:10}}
          className="pointer-events-none fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-full border border-accent/30 bg-ink-soft px-5 py-3 shadow-xl"
        >
          <p className="num text-center text-[10px] uppercase tracking-[0.16em] text-paper">
            <span className="text-accent">✦ Snizerr mode</span> — you found the easter egg!
            <span className="ml-2 text-paper-faint">Try “npm run build” for a real surprise.</span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
