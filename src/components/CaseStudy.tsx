import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { Project } from '../content/types'
import { lockScroll } from '../state/scroll'

/**
 * Full case-study panel. Rendered inline (not a portal) so it inherits the page's
 * font/loading context; role=dialog + focus management + Esc + scroll lock, and
 * every beat of the write-up is real DOM text.
 */
export function CaseStudy({ project, onClose }: { project: Project; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)

  const hasTodo = JSON.stringify(project).includes('TODO')

  useEffect(() => {
    lockScroll(true)
    const prev = document.activeElement as HTMLElement | null
    closeBtn.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel.current) return
      const f = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      lockScroll(false)
      prev?.focus?.()
    }
  }, [onClose])

  const beats: { label: string; body?: string; list?: string[] }[] = [
    { label: 'Problem', body: project.problem },
    { label: 'Approach', list: project.approach },
    { label: 'Stack', list: project.stack },
    { label: 'Result', body: project.result },
  ]

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-start justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <motion.button
        type="button"
        aria-label="Close case study"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/78 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-title"
        initial={{ y: '4%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '2.5%', opacity: 0 }}
        transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
        className="relative m-2 flex max-h-[calc(100dvh-1rem)] w-full max-w-[880px] flex-col border border-hairline bg-ink-soft/98"
      >
        <header className="flex items-start justify-between gap-6 border-b border-hairline px-5 py-4 sm:px-8 sm:py-5">
          <div>
            <p className="num text-[10px] uppercase tracking-[0.22em] text-paper-faint">
              {project.index} · {project.year} · {project.role}
            </p>
            <h2 id="case-title" className="display-sm mt-2 text-[7.4vw] leading-[1] sm:text-[34px]">
              {project.title}
            </h2>
            <p className="mt-2 text-[13px] text-paper-dim">{project.subtitle}</p>
          </div>
          <button
            ref={closeBtn}
            type="button"
            onClick={onClose}
            className="num shrink-0 border border-hairline px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-paper-dim transition-colors hover:border-paper/40 hover:text-paper"
          >
            Close ✕
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-7 sm:px-8 sm:py-9">
          {hasTodo && (
            <p className="num mb-7 border border-accent/35 bg-accent/[0.06] px-4 py-3 text-[10px] uppercase leading-[1.8] tracking-[0.16em] text-accent">
              TODO — placeholder copy in this entry · edit src/content/projects.ts
            </p>
          )}

          {project.metrics?.length ? (
            <ul className="mb-8 grid grid-cols-2 gap-px border border-hairline bg-hairline sm:grid-cols-4">
              {project.metrics.map((m) => (
                <li key={m.label} className="bg-ink-soft px-4 py-4">
                  <p className="display text-[22px] leading-none">{m.value}</p>
                  <p className="num mt-2 text-[9px] uppercase leading-[1.5] tracking-[0.16em] text-paper-faint">
                    {m.label}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          {beats.map((b, i) => (
            <section key={b.label} aria-label={b.label} className="mb-9 last:mb-2">
              <h3 className="num flex items-baseline gap-3 text-[10px] uppercase tracking-[0.22em] text-accent">
                <span className="text-paper-faint">{String(i + 1).padStart(2, '0')}</span>
                {b.label}
              </h3>
              {b.body ? (
                <p className="mt-3.5 max-w-[66ch] text-[15px] leading-[1.72] text-paper-dim">{b.body}</p>
              ) : null}
              {b.list ? (
                b.label === 'Stack' ? (
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {b.list.map((s) => (
                      <li
                        key={s}
                        className="num border border-hairline px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-paper-dim"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ol className="mt-4 space-y-4">
                    {b.list.map((s, si) => (
                      <li key={si} className="flex gap-4">
                        <span className="num pt-[3px] text-[10px] tracking-[0.14em] text-paper-faint">
                          {String(si + 1).padStart(2, '0')}
                        </span>
                        <p className="max-w-[62ch] text-[14.5px] leading-[1.7] text-paper-dim">{s}</p>
                      </li>
                    ))}
                  </ol>
                )
              ) : null}
            </section>
          ))}
        </div>

        <footer className="flex flex-wrap items-center gap-3 border-t border-hairline px-5 py-4 sm:px-8">
          {project.links.repo && (
            <a
              href={project.links.repo}
              target="_blank"
              rel="noreferrer noopener"
              className="num inline-flex items-center gap-2 bg-paper px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-ink transition-opacity hover:opacity-85"
            >
              Read the code ↗
            </a>
          )}
          {project.links.demo && (
            <a
              href={project.links.demo}
              target="_blank"
              rel="noreferrer noopener"
              className="num inline-flex items-center gap-2 border border-hairline px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-paper-dim transition-colors hover:text-paper"
            >
              Live demo ↗
            </a>
          )}
          {project.links.writeup && (
            <a
              href={project.links.writeup}
              target="_blank"
              rel="noreferrer noopener"
              className="num inline-flex items-center gap-2 border border-hairline px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-paper-dim transition-colors hover:text-paper"
            >
              Write-up ↗
            </a>
          )}
          <p className="num ml-auto hidden text-[9px] uppercase tracking-[0.18em] text-paper-faint sm:block">
            Esc to close
          </p>
        </footer>
      </motion.div>
    </motion.div>
  )
}
