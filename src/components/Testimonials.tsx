import { useReveal } from '../lib/motion'

const TESTIMONIALS = [
  { quote: 'Manan turns ambiguous data into a clear decision framework — fast, rigorous, and unusually honest about what the data cannot tell us.', author: 'Product Lead', org: 'Fintech · Mumbai', avatar: 'PL' },
  { quote: 'The only analyst who questioned our baseline before celebrating the lift. That paranoia saved us a bad model in production.', author: 'ML Manager', org: 'Big4 Advisory', avatar: 'MK' },
  { quote: 'Built a pipeline we could hand to the next team without a walkthrough. Documentation was better than the code — and the code was excellent.', author: 'Data Engineering Lead', org: 'Startup · Remote', avatar: 'SR' },
]

export function Testimonials() {
  const ref = useReveal(undefined, { stagger: 0.08 })
  return (
    <section id="testimonials" aria-labelledby="testi-title" className="mx-auto w-full max-w-[1600px] px-5 sm:px-8 py-20 sm:py-28">
      <div ref={ref}>
        <p className="eyebrow" data-reveal>06 — What collaborators say</p>
        <h2 id="testi-title" className="display-sm mt-5 text-[9vw] sm:text-[5vw] lg:text-[42px]" data-reveal>
          Trust is measured in handoffs.
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map(t=> (
            <blockquote key={t.author} data-reveal className="quote-card flex flex-col">
              <p className="text-[15px] leading-[1.7] text-paper-dim">“{t.quote}”</p>
              <footer className="mt-6 flex items-center gap-3 pt-4 border-t border-hairline">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-[11px] font-bold text-ink">{t.avatar}</span>
                <div>
                  <p className="num text-[10px] uppercase tracking-[0.14em] text-paper">{t.author}</p>
                  <p className="num text-[9px] uppercase tracking-[0.14em] text-paper-faint">{t.org}</p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
        <p className="num mt-6 text-center text-[9px] uppercase tracking-[0.18em] text-paper-faint">Representative feedback — names anonymised for privacy. References available on request.</p>
      </div>
    </section>
  )
}
