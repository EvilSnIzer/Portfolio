import { motion } from 'framer-motion'
import { about, site } from '../content/site'
import { useReveal, useSectionProgress } from '../lib/motion'

export function About() {
  const ref = useSectionProgress('about')
  const inner = useReveal(ref, { stagger: 0.07 })

  return (
    <section id="about" ref={ref} aria-labelledby="about-title" className="relative mx-auto w-full max-w-[1600px] px-5 py-24 sm:px-8 sm:py-28">
      <div ref={inner}>
        {/* Section header — editorial */}
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-8">
          <div>
            <p className="eyebrow flex items-center gap-3" data-reveal>
              <span className="h-px w-8 bg-accent" aria-hidden /> {about.eyebrow}
            </p>
            <h2 id="about-title" className="display-sm mt-5 max-w-[14ch] text-[8vw] leading-[0.9] sm:text-[3.8vw] lg:text-[42px]" data-reveal>
              {about.heading}
            </h2>
          </div>
          <p className="num hidden max-w-[28ch] text-right text-[10px] uppercase leading-[1.8] tracking-[0.14em] text-paper-faint sm:block" data-reveal>
            Principle-driven<br />systems that survive<br />the demo
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="space-y-6" data-reveal>
            {about.paragraphs.map((p, i) => (
              <p key={i} className={`leading-[1.8] ${i === 0 ? 'text-[18px] font-light text-paper sm:text-[19px]' : 'text-[15px] text-paper-dim sm:text-[16px]'}`}>
                {p}
              </p>
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              {about.focus.map((f, i) => (
                <span key={f} className="num inline-flex items-center gap-2 rounded-full border border-hairline bg-ink-soft px-3.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-paper-dim">
                  <span className="text-accent">{String(i + 1).padStart(2, '0')}</span> {f}
                </span>
              ))}
            </div>
            <p className="num border-l-2 border-accent/30 pl-4 text-[12px] leading-[1.7] text-paper-faint italic">
              “{site.blurb}”
            </p>
          </div>

          <div className="space-y-3" data-reveal>
            {about.principles.map((pr, i) => (
              <motion.div
                key={pr.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ x: 4 }}
                className="group relative overflow-hidden rounded-2xl border border-hairline bg-ink-soft p-6 transition-all hover:border-hairline-strong hover:shadow-lg hover:bg-ink-raised"
              >
                <div className="absolute left-0 top-0 h-full w-[3px] bg-accent opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                <div className="flex gap-4">
                  <span className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-raised text-[10px] font-medium tracking-[0.08em] text-paper-faint transition-colors group-hover:bg-accent group-hover:text-ink">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-paper">{pr.title}</h3>
                    <p className="mt-2 text-[13.5px] leading-[1.6] text-paper-dim">{pr.body}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <span className="h-px flex-1 bg-hairline" />
              <p className="num text-[9px] uppercase tracking-[0.2em] text-paper-faint">think → build → validate</p>
              <span className="h-px flex-1 bg-hairline" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
