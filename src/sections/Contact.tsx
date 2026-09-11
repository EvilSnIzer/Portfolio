import { useRef } from 'react'
import { motion } from 'framer-motion'
import { contactCopy, site } from '../content/site'
import { useReveal, useSectionProgress, useSplitWords } from '../lib/motion'

/**
 * 6/6 — CONTACT. Deliberately the quietest section on the page: one line of large
 * type, three links, and the single 3D accent object (scene/ContactAccent.tsx)
 * that the camera drifts past. Everything else stops moving.
 */
export function Contact({ ready }: { ready: boolean }) {
  const ref = useSectionProgress('contact', { start: 'top bottom', end: 'bottom bottom' })
  const inner = useReveal(ref, { stagger: 0.06 })
  const head = useRef<HTMLHeadingElement>(null)
  useSplitWords(head, { play: ready, delay: 0.05 })

  return (
    <section
      id="contact"
      ref={ref}
      aria-labelledby="contact-title"
      className="relative mx-auto flex min-h-[92svh] w-full max-w-[1600px] flex-col justify-center px-5 py-28 sm:px-8"
    >
      <div ref={inner} className="relative z-10">
        <p className="eyebrow" data-reveal>
          {contactCopy.eyebrow}
        </p>

        <h2
          ref={head}
          id="contact-title"
          className="display mt-7 max-w-[16ch] text-[11.5vw] sm:text-[7.6vw] lg:text-[6.4vw]"
          data-reveal
        >
          {contactCopy.heading}
        </h2>

        <p className="mt-8 max-w-[52ch] text-[15px] leading-[1.75] text-paper-dim sm:text-[16.5px]" data-reveal>
          {contactCopy.body}
        </p>

        <a
          href={`mailto:${site.email}`}
          data-reveal
          className="group mt-12 inline-flex flex-wrap items-baseline gap-4 border-y border-hairline py-6 transition-colors hover:border-paper/35"
        >
          <span className="num text-[10px] uppercase tracking-[0.24em] text-accent">Write to me</span>
          <span className="display-sm block text-[7vw] leading-none sm:text-[3.6vw] lg:text-[40px]">
            {site.email}
          </span>
          <motion.span
            aria-hidden
            className="num ml-auto hidden text-[10px] uppercase tracking-[0.2em] text-paper-faint sm:inline"
            whileHover={{ x: 6 }}
          >
            ↗
          </motion.span>
        </a>

        <ul className="mt-10 flex flex-wrap gap-x-10 gap-y-5">
          {site.links.map((l) => (
            <li key={l.label} data-reveal>
              <a
                href={l.href}
                target={l.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer noopener"
                className="group block"
              >
                <p className="num text-[9.5px] uppercase tracking-[0.22em] text-paper-faint">{l.label}</p>
                <p className="link-underline mt-1.5 inline-block text-[16px] text-paper-dim transition-colors group-hover:text-paper sm:text-[18px]">
                  {l.handle}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <footer className="relative z-10 mt-24 sm:mt-32">
        <div className="rule mb-5" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="num text-[9.5px] uppercase tracking-[0.18em] text-paper-faint">
            {site.name} · {site.role}
          </p>
          <p className="num text-[9.5px] uppercase tracking-[0.18em] text-paper-faint">
            React · R3F · GSAP ScrollTrigger · Lenis · Tailwind
          </p>
          <p className="num text-[9.5px] uppercase tracking-[0.18em] text-paper-faint">
            © {new Date().getFullYear()} · {site.location}
          </p>
        </div>
      </footer>
    </section>
  )
}
