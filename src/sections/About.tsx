import { useRef } from 'react'
import { motion } from 'framer-motion'
import { about, site } from '../content/site'
import { useReveal, useSectionProgress } from '../lib/motion'

/**
 * 2/6 — ABOUT. The panel sits beside the morphing core (left on desktop, below on
 * mobile) so the 3D object is never behind body copy. `useSectionProgress` is the
 * single writer of `scroll.section.about`, which the camera timeline reads.
 */
export function About() {
  const ref = useSectionProgress('about')
  const inner = useReveal(ref, { stagger: 0.06 })

  return (
    <section
      id="about"
      ref={ref}
      aria-labelledby="about-title"
      className="relative mx-auto flex min-h-[108svh] w-full max-w-[1600px] items-center px-5 py-28 sm:px-8"
    >
      <div ref={inner} className="grid w-full gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-20">
        <div className="max-w-[58ch]">
          <p className="eyebrow" data-reveal>
            {about.eyebrow}
          </p>
          <h2
            id="about-title"
            className="display-sm mt-6 text-[8.2vw] leading-[0.94] sm:text-[4.4vw] lg:text-[2.9vw] xl:text-[40px]"
            data-reveal
          >
            {about.heading}
          </h2>
          <div className="mt-8 space-y-5">
            {about.paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-[15px] leading-[1.75] text-paper-dim sm:text-[16.5px]"
                data-reveal
              >
                {p}
              </p>
            ))}
          </div>

          <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3" data-reveal>
            {about.focus.map((f, i) => (
              <li key={f} className="num flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-paper-faint">
                <span className="text-accent">{String(i + 1).padStart(2, '0')}</span>
                {f}
              </li>
            ))}
          </ul>

          <p className="num mt-10 text-[10px] uppercase tracking-[0.22em] text-paper-faint" data-reveal>
            {site.blurb}
          </p>
        </div>

        <div className="lg:pt-16">
          <ul className="grid gap-px overflow-hidden border border-hairline bg-hairline">
            {about.principles.map((pr, i) => (
              <li key={pr.title} className="bg-ink" data-reveal>
                <motion.div
                  whileHover={{ x: 6 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                  className="group flex items-start gap-5 px-5 py-5 sm:px-7 sm:py-6"
                >
                  <span className="num pt-1 text-[10px] tracking-[0.2em] text-paper-faint transition-colors group-hover:text-accent">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="display-sm text-[19px] sm:text-[21px]">{pr.title}</h3>
                    <p className="mt-1.5 text-[14px] leading-[1.6] text-paper-dim">{pr.body}</p>
                  </div>
                </motion.div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-3" data-reveal>
            <span className="rule flex-1" />
            <p className="num text-[9.5px] uppercase tracking-[0.2em] text-paper-faint">
              think → build → validate
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
