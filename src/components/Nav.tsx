import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { sections, scroll, scrollToSection } from '../state/scroll'
import { useQuality } from '../hooks/useMedia'

/**
 * Fixed chrome. Uses IntersectionObserver-driven `scroll.active` (already computed
 * by the scroll engine) rather than adding its own scroll listener.
 */
export function Nav({ ready }: { ready: boolean }) {
  const q = useQuality()
  const [active, setActive] = useState('hero')
  const [hidden, setHidden] = useState(false)
  const last = useRef(0)

  // 8Hz poll of the store the scroll engine already maintains: no extra scroll
  // listener, no per-frame React render, and chrome updates feel instant.
  useEffect(() => {
    const id = setInterval(() => {
      if (scroll.active) setActive(scroll.active)
      const y = scroll.y
      if (Math.abs(y - last.current) > 40) {
        setHidden(q.mobile ? false : y > last.current && y > window.innerHeight * 0.7)
        last.current = y
      }
    }, 120)
    return () => clearInterval(id)
  }, [q.mobile])

  return (
    <motion.header
      initial={{ y: -34, opacity: 0 }}
      animate={{ y: hidden ? -70 : 0, opacity: ready ? 1 : 0 }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: hidden ? 0 : 0.1 }}
      className="fixed inset-x-0 top-0 z-[60] px-5 pt-4 sm:px-8 sm:pt-6"
    >
      <nav
        aria-label="Sections"
        className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 border-b border-hairline/70 pb-3"
      >
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault()
            scrollToSection('hero')
          }}
          className="num text-[11px] font-medium tracking-[0.26em] text-paper uppercase"
        >
          MS
          <span className="ml-2 hidden text-paper-faint sm:inline">— Manan Sharma</span>
        </a>

        {!q.mobile && (
          <ul className="flex items-center gap-1">
            {sections.map((s) => {
              const on = active === s.id
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection(s.id)
                    }}
                    aria-current={on ? 'true' : undefined}
                    className="relative block px-3 py-1.5"
                  >
                    <span
                      className="num text-[10px] uppercase tracking-[0.2em] transition-colors duration-300"
                      style={{ color: on ? 'var(--color-paper)' : 'var(--color-paper-faint)' }}
                    >
                      {s.index} {s.label}
                    </span>
                    {on && (
                      <motion.span
                        layoutId="nav-dot"
                        className="absolute inset-x-2 -bottom-[13px] h-px bg-accent"
                        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                      />
                    )}
                  </a>
                </li>
              )
            })}
          </ul>
        )}

        <a
          href="#contact"
          onClick={(e) => {
            e.preventDefault()
            scrollToSection('contact')
          }}
          className="group num inline-flex shrink-0 items-center gap-2 border border-hairline px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-paper-dim transition-colors hover:border-paper/40 hover:text-paper"
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--color-accent)', boxShadow: '0 0 10px var(--color-accent)' }}
          />
          Available
        </a>
      </nav>
    </motion.header>
  )
}
