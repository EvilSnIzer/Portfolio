import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sections, scroll, scrollToSection } from '../state/scroll'
import { useQuality } from '../hooks/useMedia'
import { ThemeToggle } from './ThemeToggle'

export function Nav({ ready }: { ready: boolean }) {
  const q = useQuality()
  const [active, setActive] = useState('hero')
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const last = useRef(0)

  useEffect(() => {
    const id = setInterval(() => {
      if (scroll.active) setActive(scroll.active)
      const y = scroll.y
      setScrolled(y > 24)
      if (Math.abs(y - last.current) > 48) {
        setHidden(q.mobile ? false : y > last.current && y > window.innerHeight * 0.55)
        last.current = y
      }
    }, 100)
    return () => clearInterval(id)
  }, [q.mobile])

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: hidden ? -82 : 0, opacity: ready ? 1 : 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: hidden ? 0 : 0.15 }}
      className="fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-4 sm:pt-5 pointer-events-none"
    >
      <nav
        aria-label="Sections"
        className={`pointer-events-auto flex items-center gap-2 transition-all duration-500 ${scrolled ? 'nav-pill shadow-lg' : 'nav-pill shadow-none'} ${!q.mobile ? 'px-1.5 py-1.5' : 'px-4 py-2'}`}
        style={{ backdropFilter: 'blur(20px) saturate(1.5)', WebkitBackdropFilter: 'blur(20px) saturate(1.5)' }}
      >
        <a
          href="#hero"
          onClick={(e) => { e.preventDefault(); scrollToSection('hero') }}
          className="flex items-center gap-2 rounded-full bg-paper px-3.5 py-2 text-ink transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[10px] font-bold tracking-[0.02em] text-paper">MS</span>
          <span className="num hidden text-[10px] font-medium tracking-[0.14em] sm:inline">Manan Sharma</span>
        </a>

        {!q.mobile && (
          <ul className="flex items-center gap-0.5 rounded-full bg-ink-soft/60 p-1">
            {sections.slice(0, 5).map((s) => {
              const on = active === s.id
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => { e.preventDefault(); scrollToSection(s.id) }}
                    aria-current={on ? 'true' : undefined}
                    className={`relative block rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.14em] transition-all duration-300 ${on ? 'bg-paper text-ink shadow-sm' : 'text-paper-faint hover:text-paper'}`}
                  >
                    {s.label}
                  </a>
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex items-center gap-1.5 pl-1">
          <span className="hidden num rounded-full bg-ink-soft px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-paper-faint sm:inline">⌘K</span>
          <ThemeToggle />
          <a
            href="#contact"
            onClick={(e) => { e.preventDefault(); scrollToSection('contact') }}
            className="group hidden sm:inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-ink transition-all hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98]"
          >
            Hire me
            <span className="transition-transform group-hover:translate-x-0.5">↗</span>
          </a>
        </div>
      </nav>
    </motion.header>
  )
}
