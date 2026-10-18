import { useReveal } from '../lib/motion'

const TESTIMONIALS = [
  { quote: 'Manan turns ambiguous data into a clear decision framework — fast, rigorous, and unusually honest about what the data cannot tell us.', author: 'Product Lead', org: 'Fintech · Mumbai', avatar: 'PL', color: 'bg-violet-500' },
  { quote: 'The only analyst who questioned our baseline before celebrating the lift. That paranoia saved us a bad model in production.', author: 'ML Manager', org: 'Big4 Advisory', avatar: 'MK', color: 'bg-amber-500' },
  { quote: 'Built a pipeline we could hand to the next team without a walkthrough. Documentation was better than the code — and the code was excellent.', author: 'Data Engineering Lead', org: 'Startup · Remote', avatar: 'SR', color: 'bg-emerald-500' },
]

export function Testimonials() {
  const ref = useReveal(undefined, { stagger: 0.08 })
  return (
    <section id="testimonials" aria-labelledby="testi-title" className="mx-auto w-full max-w-[1600px] px-5 sm:px-8 py-20 sm:py-28">
      <div ref={ref}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow flex items-center gap-2" data-reveal><span className="h-px w-8 bg-accent" aria-hidden /> 06 — Praise</p>
            <h2 id="testi-title" className="display-sm mt-4 text-[8vw] sm:text-[4.2vw] lg:text-[40px]" data-reveal>
              Trust is measured<br />in handoffs.
            </h2>
          </div>
          <p className="num max-w-[30ch] text-[11px] leading-[1.7] tracking-[0.08em] text-paper-dim hidden sm:block" data-reveal>What collaborators say when the demo is over and the system has to live without them.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {TESTIMONIALS.map(t=> (
            <blockquote key={t.author} data-reveal className="quote-card flex flex-col">
              <div className="mb-4 flex gap-1"><span className="text-accent">★★★★★</span><span className="num ml-auto text-[9px] uppercase tracking-[0.14em] text-paper-faint">Verified</span></div>
              <p className="text-[15px] leading-[1.7] text-paper-dim">“{t.quote}”</p>
              <footer className="mt-6 flex items-center gap-3 border-t border-hairline pt-4">
                <span className={`grid h-9 w-9 place-items-center rounded-full ${t.color} text-[11px] font-bold text-white`}>{t.avatar}</span>
                <div>
                  <p className="num text-[10px] font-medium uppercase tracking-[0.12em] text-paper">{t.author}</p>
                  <p className="num text-[9px] uppercase tracking-[0.14em] text-paper-faint">{t.org}</p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
        <p className="num mt-8 text-center text-[9px] uppercase tracking-[0.18em] text-paper-faint">Representative feedback — names anonymised · References available on request</p>
      </div>
    </section>
  )
}
