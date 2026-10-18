import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { contactCopy, site } from '../content/site'
import { useReveal, useSectionProgress, useSplitWords } from '../lib/motion'
import { ContactForm } from '../components/ContactForm'

export function Contact({ ready }: { ready: boolean }) {
  const ref = useSectionProgress('contact', { start: 'top bottom', end: 'bottom bottom' })
  const inner = useReveal(ref, { stagger: 0.06 })
  const head = useRef<HTMLHeadingElement>(null)
  useSplitWords(head, { play: ready, delay: 0.05 })
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)
  useEffect(()=>()=>{ if(timer.current) window.clearTimeout(timer.current)},[])
  const copyEmail = async () => {
    try { await navigator.clipboard.writeText(site.email) } catch {
      const ta=document.createElement('textarea'); ta.value=site.email; ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove()
    }
    setCopied(true); if(timer.current) window.clearTimeout(timer.current); timer.current=window.setTimeout(()=>setCopied(false),2000)
  }
  return (
    <section id="contact" ref={ref} aria-labelledby="contact-title" className="relative mx-auto w-full max-w-[1600px] px-5 py-20 sm:px-8 sm:py-28">
      <div ref={inner} className="relative z-10">
        <p className="eyebrow flex items-center gap-3" data-reveal>
          <span className="h-px w-8 bg-accent" aria-hidden /> {contactCopy.eyebrow}
        </p>
        <h2 ref={head} id="contact-title" className="display mt-6 max-w-[16ch] text-[11vw] sm:text-[7vw] lg:text-[5.8vw] leading-[0.86]" data-reveal>
          {contactCopy.heading}
        </h2>
        <p className="mt-6 max-w-[52ch] text-[15px] leading-[1.75] text-paper-dim sm:text-[17px]" data-reveal>{contactCopy.body}</p>

        <div data-reveal className="mt-10 overflow-hidden rounded-[20px] border border-hairline bg-ink-soft">
          <a href={`mailto:${site.email}?subject=${encodeURIComponent(contactCopy.heading)}`} className="group flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 transition-colors hover:bg-ink-raised">
            <div>
              <span className="num flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-accent">Write to me</span>
              <span className="display-sm mt-2 block text-[6vw] sm:text-[3vw] lg:text-[36px] leading-none">{site.email}</span>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper text-ink transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">↗</span>
          </a>
          <div className="flex items-center justify-between border-t border-hairline px-6 py-3 sm:px-8">
            <button type="button" onClick={copyEmail} aria-live="polite" className="num inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-paper-faint transition-colors hover:text-paper">
              <span className={`grid h-6 w-6 place-items-center rounded-full border text-[11px] transition-colors ${copied ? 'bg-accent border-accent text-ink' : 'border-hairline'}`}>{copied?'✓':'⧉'}</span> {copied?'Copied!':'Copy email'}
            </button>
            <span className="num hidden text-[9px] uppercase tracking-[0.16em] text-paper-faint sm:inline">Avg. reply · 4 hours</span>
          </div>
        </div>

        <div data-reveal className="mt-12">
          <h3 className="flex items-center gap-3 text-[13px] font-semibold tracking-[-0.02em]">
            <span className="h-px w-6 bg-accent" aria-hidden /> Send a message
          </h3>
          <p className="num mt-1 text-[10px] tracking-[0.12em] text-paper-faint">Validated · rate-limited · falls back to mail client</p>
          <div className="mt-6 rounded-[20px] border border-hairline bg-ink-soft/50 p-6 backdrop-blur-sm sm:p-8">
            <ContactForm />
          </div>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-3">
          {site.links.map((l) => (
            <li key={l.label} data-reveal>
              <a href={l.href} target={l.href.startsWith('http')?'_blank':undefined} rel="noreferrer noopener" className="group flex items-center justify-between rounded-2xl border border-hairline bg-ink-soft p-5 transition-all hover:border-hairline-strong hover:bg-ink-raised hover:shadow-md">
                <div>
                  <p className="num text-[9px] uppercase tracking-[0.2em] text-paper-faint">{l.label}</p>
                  <p className="mt-1 text-[14px] font-medium text-paper-dim group-hover:text-paper transition-colors">{l.handle}</p>
                </div>
                <span className="grid h-8 w-8 place-items-center rounded-full border border-hairline text-[12px] text-paper-faint transition-all group-hover:bg-paper group-hover:text-ink group-hover:border-paper">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <footer className="relative z-10 mt-20">
        <div className="h-px bg-hairline" />
        <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="num text-[10px] uppercase tracking-[0.16em] text-paper-faint">{site.name} · {site.role} · © {new Date().getFullYear()}</p>
          <p className="num text-[10px] uppercase tracking-[0.16em] text-paper-faint">Built with React · R3F · GSAP · Lenis — Crafted in India · Remote worldwide</p>
        </div>
      </footer>
    </section>
  )
}
