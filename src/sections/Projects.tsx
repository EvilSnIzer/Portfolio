import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects } from '../content/projects'
import type { Project } from '../content/types'
import { sceneState } from '../scene/sceneState'
import { useReveal } from '../lib/motion'
import { getQuality } from '../state/quality'
import { scroll, scrollToY } from '../state/scroll'
import {
  focusOffset,
  indexForProgress,
  offsetForIndex,
  offsetForProgress,
  progressForIndex,
  progressForOffset,
  railTravel,
} from '../lib/rail'
import { CaseStudy } from '../components/CaseStudy'

/**
 * 4/6 — PROJECTS. A horizontal rail, driven by vertical scroll, inside a pin.
 *
 * One number rules the whole section: `sceneState.projects.x` (0 → 1), written by
 * a single scrubbed ScrollTrigger. The DOM track is translated by `-x·travel` and
 * the WebGL plates follow `x` off the same store, so the 2D and 3D layers are
 * physically incapable of drifting apart.
 *
 * THE TRAVEL IS THIS SECTION'S BUG HISTORY. It used to be measured off a
 * `display: contents` wrapper, which generates no layout box, so `scrollWidth`
 * came back 0 → travel 0 → the pin got `end: '+=0'` → the rail had no scroll
 * length and never moved. So: measure the *real* flex track against the overflow
 * viewport, make `end` a function so every refresh re-reads it, and keep the
 * arithmetic in `src/lib/rail` where the invariants are testable.
 *
 * On touch we drop the pin for a native scroll-snap rail — a pinned horizontal
 * section is miserable on a phone — but the rail's scrollLeft feeds the *same*
 * store, so the 3D plates keep tracking the cards either way.
 */
const CARD_W = 400

export function Projects() {
  const section = useRef<HTMLElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLElement | null)[]>([])
  const geomRef = useRef({ n: projects.length, travel: 0 })
  const stRef = useRef<ReturnType<typeof ScrollTrigger.create> | null>(null)
  const activeRef = useRef(0)
  const suppressClick = useRef(false)
  const desktopRef = useRef(true)

  const reveal = useReveal()
  const [open, setOpen] = useState<Project | null>(null)
  const [desktop, setDesktop] = useState(true)
  const [active, setActive] = useState(0)

  useEffect(() => {
    // Same gate as the camera fly-through, plus a real pointer: a 1024px
    // touchscreen gets the native rail because drag-to-scroll fights the pin.
    const mq = window.matchMedia('(min-width: 1024px) and (pointer: fine)')
    const apply = () => {
      const on = getQuality().flyThrough && mq.matches
      desktopRef.current = on
      setDesktop(on)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  /**
   * Read the real box geometry: the only two numbers the interaction needs.
   * Called on mount, on every ScrollTrigger refresh and on resize.
   */
  const measure = useCallback(() => {
    const track = trackRef.current
    const wrap = wrapRef.current
    if (!track || !wrap) return geomRef.current
    const list = cards.current.filter(Boolean) as HTMLElement[]
    if (!list.length) return geomRef.current
    const cardW = list[0].offsetWidth || CARD_W
    const gap = list.length > 1 ? Math.max(0, list[1].offsetLeft - list[0].offsetLeft - cardW) : 0
    const inset = Math.max(0, list[0].offsetLeft)
    const vpW = wrap.clientWidth
    // Truth is the box model: the track is `w-max`, so its scrollWidth *is* its
    // content width. railTravel() is the arithmetic cross-check, and it is what
    // keeps the travel honest when scrollWidth rounds down at fractional DPRs.
    const travel = Math.max(0, Math.round(Math.max(track.scrollWidth - vpW, railTravel({ n: list.length, cardW, gap, inset, vpW }))))
    geomRef.current = { n: list.length, travel }
    return geomRef.current
  }, [])

  // ── desktop: pin the section and scrub the track through it ───────────────
  useEffect(() => {
    const el = section.current
    const track = trackRef.current
    if (!el || !track) return

    if (!desktop) {
      // Touch: hand the horizontal axis back to the browser, and make sure no
      // stale desktop value is left behind in the shared store.
      gsap.set(track, { x: 0 })
      stRef.current = null
      sceneState.projects.x = 0
      scroll.section.projects = 0
      measure()
      return
    }

    const apply = (progress: number) => {
      const { travel } = geomRef.current
      sceneState.projects.x = progress
      scroll.section.projects = progress
      gsap.set(track, { x: -offsetForProgress(progress, travel) })
    }

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: () => `+=${measure().travel}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: 1.1,
      invalidateOnRefresh: true,
      // Re-read the travel, then re-assert the position: after a refresh the pin
      // range is new but `onUpdate` will not fire until the next scroll, and a
      // resized window with the rail mid-travel is exactly when a wrong x shows.
      onRefresh: (self) => apply(self.progress),
      onUpdate: (self) => apply(self.progress),
    })
    stRef.current = st
    // This section's progress belongs to the pin alone. `useSectionProgress` used
    // to run a second trigger over a different range and both wrote the same key,
    // so the rail fought itself every frame.
    apply(st.progress)

    // Re-measure when late work settles: web fonts reflow the header.
    document.fonts?.ready.then(() => st.refresh())
    const onReflow = () => st.refresh()
    window.addEventListener('load', onReflow)
    window.addEventListener('resize', onReflow, { passive: true })

    return () => {
      window.removeEventListener('load', onReflow)
      window.removeEventListener('resize', onReflow)
      st.kill()
      stRef.current = null
      gsap.set(track, { x: 0 })
      sceneState.projects.x = 0
      scroll.section.projects = 0
    }
  }, [desktop, measure])

  // ── touch: derive the same 0→1 from native scrollLeft ─────────────────────
  useEffect(() => {
    if (desktop) return
    const track = trackRef.current
    if (!track) return
    const onScroll = () => {
      const { travel } = geomRef.current
      const p = progressForOffset(track.scrollLeft, travel)
      sceneState.projects.x = p
      scroll.section.projects = p
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    const onResize = () => {
      measure()
      onScroll()
    }
    window.addEventListener('resize', onResize, { passive: true })
    measure()
    onScroll()
    return () => {
      track.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      sceneState.projects.x = 0
      scroll.section.projects = 0
    }
  }, [desktop, measure])

  // ── one rAF: focus treatment + HUD, reading the store, never the scrollbar ─
  useEffect(() => {
    let id = 0
    const reduced = getQuality().reduced
    const loop = () => {
      id = requestAnimationFrame(loop)
      const track = trackRef.current
      const g = geomRef.current
      if (!track || g.n === 0) return
      const progress = desktop ? sceneState.projects.x : progressForOffset(track.scrollLeft, g.travel)

      const fill = g.travel > 0 ? progress : 0
      barRef.current?.style.setProperty('--fill', fill.toFixed(4))
      if (reduced) return

      // --f is signed distance from focus in card steps, --a its magnitude: the
      // CSS turns them into parallax, dim, scale and desaturation. Ten property
      // writes a frame across five cards beats five getBoundingClientRect reads.
      for (let i = 0; i < g.n; i++) {
        const el = cards.current[i]
        if (!el) continue
        const f = focusOffset(i, g.n, progress)
        el.style.setProperty('--f', f.toFixed(3))
        el.style.setProperty('--a', Math.min(1, Math.abs(f)).toFixed(3))
      }
      const near = indexForProgress(progress, g.n)
      if (near !== activeRef.current) {
        activeRef.current = near
        setActive(near)
      }
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [desktop])

  /**
   * Move the rail to a card. While pinned that means moving the *page* scroll,
   * because the pin is what owns the horizontal axis — translating the track
   * directly would fight the scrub and snap back on the next frame.
   */
  const goTo = useCallback(
    (i: number) => {
      const { n, travel } = geomRef.current
      const p = progressForIndex(i, n)
      const st = stRef.current
      if (desktopRef.current && st && st.end > st.start) {
        scrollToY(st.start + p * (st.end - st.start))
      } else {
        trackRef.current?.scrollTo({ left: offsetForIndex(i, n, travel), behavior: 'smooth' })
      }
    },
    []
  )

  // ── drag / trackpad-swipe: the rail obeys the pointer by moving the page ────
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || !desktop) return
    const d = { on: false, x0: 0, y0: 0, moved: 0 }

    // Deliberately *not* pointer-captured: capture re-targets the click that ends
    // the gesture onto the wrapper, so the card's own button never fires and
    // dragging would silently break "click a plate for the case study". Window
    // listeners give the same follow-outside-the-box behaviour without that cost.
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || !(geomRef.current.travel > 0)) return
      d.on = true
      d.x0 = e.clientX
      d.y0 = scroll.y
      d.moved = 0
    }
    const move = (e: PointerEvent) => {
      if (!d.on) return
      const dx = e.clientX - d.x0
      d.moved = Math.max(d.moved, Math.abs(dx))
      if (d.moved > 8) {
        // A click always follows pointerup; armed here so a drag never opens a
        // case study the user never meant to open.
        suppressClick.current = true
        scrollToY(d.y0 - dx, { immediate: true })
      }
    }
    const up = () => {
      if (!d.on) return
      d.on = false
      wrap.classList.remove('is-dragging')
      // Let the click that always follows pointerup land before re-arming.
      requestAnimationFrame(() => setTimeout(() => (suppressClick.current = false), 0))
    }
    // Horizontal wheel intent belongs to a horizontal rail. Only while the pin is
    // actually active, or a trackpad's slight dx would hijack normal scrolling.
    const wheel = (e: WheelEvent) => {
      const st = stRef.current
      if (!st || !st.isActive || Math.abs(e.deltaX) <= Math.abs(e.deltaY) + 2) return
      e.preventDefault()
      scrollToY(scroll.y + e.deltaX, { immediate: true })
    }

    // move/up live on the window so a fast drag that outruns the wrapper keeps
    // tracking, and so the pointerup outside the section still ends the gesture.
    wrap.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    wrap.addEventListener('wheel', wheel, { passive: false })
    return () => {
      wrap.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      wrap.removeEventListener('wheel', wheel)
    }
  }, [desktop])

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const n = geomRef.current.n || projects.length
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      goTo(Math.min(n - 1, activeRef.current + 1))
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goTo(Math.max(0, activeRef.current - 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      goTo(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      goTo(n - 1)
    }
  }

  const total = projects.length
  const hint = desktop
    ? 'Scroll, drag or use ← → · click any plate for the case study'
    : 'Swipe the rail · tap a card for the case study'

  return (
    <>
      <section
        id="projects"
        ref={section}
        aria-labelledby="projects-title"
        onKeyDown={onKeyDown}
        className="relative w-full"
      >
        <div
          className={
            desktop
              ? 'mx-auto flex min-h-[100svh] w-full max-w-[1600px] flex-col justify-center px-5 py-10 sm:px-8 sm:py-14'
              : 'mx-auto flex w-full max-w-[1600px] flex-col px-5 pb-8 pt-24 sm:px-8 sm:pt-28'
          }
        >
          <div ref={reveal} className="flex flex-wrap items-end justify-between gap-5 pb-8">
            <div>
              <p className="eyebrow" data-reveal>
                03 — Selected work
              </p>
              <h2
                id="projects-title"
                className="display-sm mt-5 text-[9vw] sm:text-[5.2vw] lg:text-[44px]"
                data-reveal
              >
                Repos, and what they prove
              </h2>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <p className="num max-w-[26ch] text-[10px] uppercase leading-[1.9] tracking-[0.18em] text-paper-faint" data-reveal>
                {hint}
              </p>
              <div className="rail-nav" data-reveal>
                <button
                  type="button"
                  className="rail-btn"
                  aria-label="Previous project"
                  onClick={() => goTo(activeRef.current - 1)}
                  disabled={active === 0}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15 5 8 12l7 7" />
                  </svg>
                </button>
                <span className="num rail-count">
                  {String(active + 1).padStart(2, '0')}
                  <span className="rail-count-sep">/</span>
                  <span className="rail-count-total">{String(total).padStart(2, '0')}</span>
                </span>
                <button
                  type="button"
                  className="rail-btn"
                  aria-label="Next project"
                  onClick={() => goTo(activeRef.current + 1)}
                  disabled={active >= total - 1}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div
            ref={wrapRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Selected projects"
            className={desktop ? 'rail-viewport relative w-full cursor-grab' : 'relative w-full overflow-x-clip'}
          >
            <div
              ref={trackRef}
              className={
                desktop
                  ? 'flex w-max gap-10 pb-2 pt-2 will-change-transform'
                  : 'no-scrollbar flex w-full gap-6 overflow-x-auto px-5 pb-2 pt-2 sm:px-8 [scroll-snap-type:x_proximity]'
              }
            >
              {projects.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  p={p}
                  index={i}
                  active={i === active}
                  depth={desktop && !getQuality().reduced}
                  setRef={(el) => {
                    // Block body on purpose: React 19 treats a returned value from
                    // a ref callback as a cleanup function, and an HTMLElement isn't one.
                    cards.current[i] = el
                  }}
                  onOpen={() => {
                    if (suppressClick.current) return
                    setOpen(p)
                  }}
                  onHover={(on) => (sceneState.projects.hovered = on ? i : -1)}
                />
              ))}
            </div>
            {/* Plates dissolve at the rail ends instead of being sliced by it. */}
            {desktop ? (
              <>
                <div aria-hidden className="rail-fade rail-fade-l" />
                <div aria-hidden className="rail-fade rail-fade-r" />
              </>
            ) : null}
          </div>

          <div className="rail-hud">
            <div ref={barRef} className="rail-bar" role="presentation">
              <span className="rail-bar-fill" />
            </div>
            {/* A button group, not a tablist: tabs promise to reveal a panel in the
                same slot, and these jump a scroll position instead. */}
            <div className="rail-seg" role="group" aria-label="Jump to project">
              {projects.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  aria-current={i === active ? 'true' : undefined}
                  aria-label={`${p.index} · ${p.title}`}
                  data-on={i === active ? '1' : undefined}
                  onClick={() => goTo(i)}
                  className="rail-seg-btn"
                >
                  <span className="num">{p.index}</span>
                </button>
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

/**
 * Card: real screenshot under a duotone wash, or a generated plate if missing.
 * Tilt is Framer's springs (no re-render); the focus treatment is two custom
 * properties written by the section's single rAF loop, so the rail has one writer.
 */
function ProjectCard({
  p,
  index,
  active,
  depth,
  setRef,
  onOpen,
  onHover,
}: {
  p: Project
  index: number
  active: boolean
  depth: boolean
  setRef: (el: HTMLElement | null) => void
  onOpen: () => void
  onHover: (on: boolean) => void
}) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 220, damping: 26, mass: 0.6 })
  const sy = useSpring(my, { stiffness: 220, damping: 26, mass: 0.6 })
  const rotateY = useTransform(sx, [-0.5, 0.5], [-6, 6])
  const rotateX = useTransform(sy, [-0.5, 0.5], [4, -4])
  const imgX = useTransform(sx, [-0.5, 0.5], [12, -12])
  const imgY = useTransform(sy, [-0.5, 0.5], [8, -8])
  const [imgOk, setImgOk] = useState(true)
  // Placeholder-proofing: `sme-fintech-sales-ops` is still a TODO-shaped entry in
  // src/content/projects.ts, and a card that *enlarges* the fields would print
  // "TODO — your role on this" in amber at the top of a portfolio. So the card
  // degrades instead: subtitle falls back to the blurb, unfilled fields drop out.
  const real = (v?: string) => (v && !v.includes('TODO') ? v : null)
  const kicker = real(p.role)
  const sub = real(p.subtitle) ?? real(p.blurb)
  const year = real(p.year)
  const tags = p.tags.filter((t) => !t.includes('TODO'))
  const metric = p.metrics?.find((m) => real(m.value) && real(m.label))

  return (
    <motion.article
      ref={setRef}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => {
        onHover(false)
        mx.set(0)
        my.set(0)
      }}
      onMouseMove={(e) => {
        if (!depth) return
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width - 0.5)
        my.set((e.clientY - r.top) / r.height - 0.5)
      }}
      style={{ rotateX, rotateY, transformPerspective: 1200, scrollSnapAlign: 'center' }}
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px -40px 0px 0px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: Math.min(0.24, index * 0.05) }}
      className="group rail-item shrink-0"
      data-active={active ? '1' : undefined}
    >
      <div className="rail-card" data-depth={depth ? '1' : undefined}>
        <div className="rail-face">
          {p.image && imgOk ? (
            <motion.img
              src={p.image}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setImgOk(false)}
              style={{ x: imgX, y: imgY }}
              className="rail-img"
            />
          ) : (
            <Plate index={index} />
          )}
          <span aria-hidden className="rail-veil" />
          <span aria-hidden className="rail-sheen" />

          <span aria-hidden className="rail-ticks">
            <i />
            <i />
            <i />
            <i />
          </span>

          <div className="rail-top">
            <span className="num rail-index">{p.index}</span>
            {year ? <span className="num rail-year">{year}</span> : null}
          </div>

          <div className="rail-body">
            {kicker ? <p className="num rail-kicker">{kicker}</p> : null}
            <h3 className="display-sm rail-title">{p.title}</h3>
            {sub ? <p className="rail-sub">{sub}</p> : null}
            <ul className="rail-tags">
              {tags.slice(0, 4).map((t) => (
                <li key={t} className="num rail-tag">
                  {t}
                </li>
              ))}
            </ul>
            {metric ? (
              <p className="rail-metric">
                <span className="display rail-metric-v num">{metric.value}</span>
                <span className="num rail-metric-l">{metric.label}</span>
              </p>
            ) : null}
            <span className="rail-cta">
              Case study
              <i aria-hidden />
            </span>
          </div>

          {/*
            The whole plate is one hit target, but the *control* is a sibling rather
            than a wrapper: a <button> may only contain phrasing content, and this
            card's content is headings, paragraphs and a list. The overlay button
            keeps the semantics valid and the text selectable by AT.
          */}
          <button
            type="button"
            className="rail-hit"
            onClick={onOpen}
            aria-label={`Open case study: ${p.title}`}
          />

          {p.links.repo ? (
            <a
              href={p.links.repo}
              target="_blank"
              rel="noreferrer noopener"
              className="num rail-repo"
            >
              Code ↗
            </a>
          ) : null}
        </div>
      </div>
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
