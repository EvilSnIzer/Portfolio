import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects } from '../content/projects'
import type { Project } from '../content/types'
import { sceneState } from '../scene/sceneState'
import { useReveal, useSectionProgress } from '../lib/motion'
import { getQuality } from '../state/quality'
import { scroll } from '../state/scroll'
import { CaseStudy } from '../components/CaseStudy'

/**
 * 4/6 — PROJECTS. Horizontal scroll, pinned.
 *
 * One number rules the whole section: `sceneState.projects.x` (0 → 1), written by
 * a single scrubbed ScrollTrigger. The DOM track is translated by `x` and the WebGL
 * plates are translated by `-x` off the same store, so the 2D and 3D layers are
 * physically incapable of drifting apart. On touch we drop the pin for a native
 * scroll-snap rail: a pinned horizontal section is miserable on a phone.
 */
const CARD_W = 400 // design width, px
const CARD_H = 470
const PITCH = 440

export function Projects() {
  const ref = useSectionProgress('projects', { start: 'top top', end: '+=100%' })
  const track = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const reveal = useReveal()
  const [open, setOpen] = useState<Project | null>(null)
  const [desktop, setDesktop] = useState(true)

  useLayoutEffect(() => {
    const apply = () => {
      const q = getQuality()
      setDesktop(q.flyThrough)
    }
    apply()
    const m = window.matchMedia('(min-width: 1024px) and (pointer: fine)')
    m.addEventListener('change', apply)
    return () => m.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const el = ref.current
    const innerEl = inner.current
    if (!el || !innerEl) return

    if (!desktop) {
      // Touch: hand the horizontal axis back to the browser.
      gsap.set(track.current, { x: 0 })
      sceneState.projects.x = 0
      return
    }

    const distance = Math.max(0, innerEl.scrollWidth - el.clientWidth + 40)
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: `+=${distance}`,
      pin: true,
      anticipatePin: 1,
      scrub: 1.1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // THE number for this section. DOM track, WebGL plates and the camera all
        // consume it; nothing else is authoritative.
        sceneState.projects.x = self.progress
        scroll.section.projects = self.progress
        gsap.set(track.current, { x: -self.progress * distance })
      },
    })
    const onResize = () => st.refresh()
    window.addEventListener('resize', onResize)
    return () => {
      st.kill()
      window.removeEventListener('resize', onResize)
    }
  }, [desktop, ref])

  // Lock the section's own progress to the pinned range when on touch, so the
  // store is never left with a stale desktop value.
  useEffect(() => {
    if (desktop || !ref.current) return
    const el = ref.current
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        scroll.section.projects = self.progress
      },
    })
    return () => st.kill()
  }, [desktop, ref])

  return (
    <>
    <section
      id="projects"
      ref={ref}
      aria-labelledby="projects-title"
      className="relative w-full"
    >
      <div ref={reveal} className="mx-auto flex w-full max-w-[1600px] flex-col px-5 pt-24 sm:px-8 sm:pt-28">
        <header className="flex flex-wrap items-end justify-between gap-5 pb-8">
          <div>
            <p className="eyebrow" data-reveal>
              03 — Selected work
            </p>
            <h2 id="projects-title" className="display-sm mt-5 text-[9vw] sm:text-[5.2vw] lg:text-[44px]" data-reveal>
              Repos, and what they prove
            </h2>
          </div>
          <p
            className="num max-w-[34ch] text-[10px] uppercase leading-[1.9] tracking-[0.18em] text-paper-faint"
            data-reveal
          >
            {desktop ? 'Scroll → the rail moves. Click any plate for the case study.' : 'Swipe the rail → tap a card.'}
          </p>
        </header>
      </div>

      <div className="relative w-full overflow-x-clip">
        <div
          ref={track}
          className={
            desktop
              ? 'flex w-max gap-10 px-5 pb-16 pt-2 will-change-transform sm:px-8'
              : 'no-scrollbar flex w-full gap-6 overflow-x-auto px-5 pb-16 pt-2 sm:px-8 [scroll-snap-type:x_proximity]'
          }
        >
          <div ref={inner} className="contents">
            {projects.map((p, i) => (
              <ProjectCard
                key={p.id}
                p={p}
                index={i}
                onOpen={() => setOpen(p)}
                onHover={(on) => (sceneState.projects.hovered = on ? i : -1)}
              />
            ))}
          </div>
        </div>
      </div>

    </section>
    {/* Portal only while open — no createPortal during SSR/prerender at all. */}
    {open
      ? createPortal(
          <AnimatePresence onExitComplete={() => setOpen(null)}>
            <CaseStudy project={open} onClose={() => setOpen(null)} />
          </AnimatePresence>,
          document.body
        )
      : null}
    </>
  )
}



/** Tilted plate with cursor-driven parallax (Framer Motion springs, no re-render). */
function ProjectCard({
  p,
  index,
  onOpen,
  onHover,
}: {
  p: Project
  index: number
  onOpen: () => void
  onHover: (on: boolean) => void
}) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 220, damping: 26, mass: 0.6 })
  const sy = useSpring(my, { stiffness: 220, damping: 26, mass: 0.6 })
  const rotateY = useTransform(sx, [-0.5, 0.5], [-7, 7])
  const rotateX = useTransform(sy, [-0.5, 0.5], [5, -5])
  const imgX = useTransform(sx, [-0.5, 0.5], [10, -10])
  const imgY = useTransform(sy, [-0.5, 0.5], [7, -7])
  const [imgOk, setImgOk] = useState(true)

  return (
    <motion.article
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => {
        onHover(false)
        mx.set(0)
        my.set(0)
      }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width - 0.5)
        my.set((e.clientY - r.top) / r.height - 0.5)
      }}
      style={{ rotateX, rotateY, transformPerspective: 1100, width: CARD_W, scrollSnapAlign: 'start' }}
      initial={{ opacity: 0, y: 40, rotateX: 6 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: Math.min(0.28, index * 0.06) }}
      className="group relative shrink-0"
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open case study: ${p.title}`}
        className="block w-full cursor-pointer text-left"
      >
        <div
          className="relative overflow-hidden border border-hairline bg-ink-soft"
          style={{ height: CARD_H }}
        >
          {/* Media: real screenshot if present, procedural plate if not. */}
          {p.image && imgOk ? (
            <motion.img
              src={p.image}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setImgOk(false)}
              style={{ x: imgX, y: imgY, scale: 1.08 }}
              className="absolute inset-0 h-full w-full object-cover opacity-[0.62] transition-opacity duration-500 group-hover:opacity-[0.86]"
            />
          ) : (
            <Plate index={index} />
          )}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(10,10,10,0.95) 6%, rgba(10,10,10,0.35) 46%, rgba(10,10,10,0.06) 100%)',
            }}
          />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
            <span className="num text-[10px] tracking-[0.2em] text-paper-faint">{p.index}</span>
            <span className="num text-[10px] tracking-[0.2em] text-paper-faint">{p.year}</span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5">
            <h3 className="display-sm text-[24px] leading-[1.05] text-paper sm:text-[26px]">{p.title}</h3>
            <p className="mt-1.5 text-[12.5px] leading-[1.5] text-paper-dim">{p.subtitle}</p>
            <ul className="mt-3.5 flex flex-wrap gap-1.5">
              {p.tags.slice(0, 4).map((t) => (
                <li
                  key={t}
                  className="num border border-hairline px-2 py-[3px] text-[9px] uppercase tracking-[0.14em] text-paper-faint"
                >
                  {t}
                </li>
              ))}
            </ul>
            <p className="num mt-4 inline-flex items-center gap-2 text-[9.5px] uppercase tracking-[0.2em] text-paper-dim transition-colors group-hover:text-accent">
              Case study
              <span aria-hidden className="block h-px w-6 bg-current transition-all duration-500 group-hover:w-10" />
            </p>
          </div>
        </div>
      </button>
      {p.links.repo && (
        <a
          href={p.links.repo}
          target="_blank"
          rel="noreferrer noopener"
          className="num absolute right-4 top-16 z-10 border border-hairline bg-ink/70 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-paper-dim opacity-0 backdrop-blur-sm transition-all duration-300 hover:text-paper group-hover:opacity-100 group-focus-within:opacity-100"
        >
          Code ↗
        </a>
      )}
    </motion.article>
  )
}

/** Vector fallback so a missing screenshot still looks designed. */
function Plate({ index }: { index: number }) {
  const seed = index + 1
  return (
    <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 400 470" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`pg${index}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#191917" />
          <stop offset="100%" stopColor="#0d0d0c" />
        </linearGradient>
      </defs>
      <rect width="400" height="470" fill={`url(#pg${index})`} />
      {Array.from({ length: 16 }).map((_, i) => (
        <path
          key={i}
          d={`M0 ${28 + i * 26} Q ${140 + ((i * seed * 13) % 120)} ${6 + i * 26 + ((i * seed) % 40)} 400 ${
            36 + i * 24
          }`}
          fill="none"
          stroke={i % 5 === 0 ? 'rgba(243,166,59,0.28)' : 'rgba(242,242,240,0.07)'}
          strokeWidth={i % 5 === 0 ? 1.1 : 0.7}
        />
      ))}
    </svg>
  )
}
