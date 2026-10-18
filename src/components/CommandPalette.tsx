import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { projects } from '../content/projects'
import { sections, scrollToSection } from '../state/scroll'

const ACTIONS = [
  ...sections.map(s => ({ id: `go-${s.id}`, label: `Go to ${s.label}`, sub: `${s.index} · ${s.id}`, run: () => scrollToSection(s.id) })),
  { id: 'github', label: 'Open GitHub', sub: 'github.com/EvilSnIzer', run: () => window.open('https://github.com/EvilSnIzer','_blank') },
  { id: 'linkedin', label: 'Open LinkedIn', sub: 'Manan Sharma', run: () => window.open('https://www.linkedin.com/in/manan-sharma-144752201','_blank') },
  { id: 'email', label: 'Email Manan', sub: 'manan.naitik@gmail.com', run: () => window.location.href='mailto:manan.naitik@gmail.com' },
  { id: 'resume', label: 'Download Resume', sub: 'PDF', run: () => window.open('/resume.pdf','_blank') },
  ...projects.map(p => ({ id: `proj-${p.id}`, label: p.title, sub: `Project · ${p.subtitle}`, run: () => { scrollToSection('projects'); setTimeout(()=> document.querySelector(`[data-project=\"${p.id}\"] button`)?.dispatchEvent(new Event('click',{bubbles:true})), 650) } })),
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k') { e.preventDefault(); setOpen(o=>!o) }
      if (e.key==='Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  }, [])

  const filtered = useMemo(() => {
    if (!q.trim()) return ACTIONS
    const s = q.toLowerCase()
    return ACTIONS.filter(a => a.label.toLowerCase().includes(s) || a.sub.toLowerCase().includes(s))
  }, [q])

  useEffect(()=> setActive(0), [q, open])
  if (!open) return null
  return createPortal(
    <>
      <div className="cmdk-backdrop" onClick={()=> setOpen(false)} />
      <div className="cmdk-panel" role="dialog" aria-modal="true" aria-label="Command palette">
        <input
          autoFocus
          placeholder="Type a command or search… (try 'projects' or 'github')"
          className="cmdk-input"
          value={q}
          onChange={e=> setQ(e.target.value)}
          onKeyDown={e=>{
            if (e.key==='ArrowDown') { e.preventDefault(); setActive(a=> Math.min(a+1, filtered.length-1)) }
            if (e.key==='ArrowUp') { e.preventDefault(); setActive(a=> Math.max(a-1,0)) }
            if (e.key==='Enter') { e.preventDefault(); filtered[active]?.run(); setOpen(false) }
          }}
        />
        <div className="cmdk-list">
          {filtered.map((a,i)=> (
            <button key={a.id} data-active={i===active?'1':undefined} className="cmdk-item" onClick={()=>{a.run(); setOpen(false)}}>
              <span className="num text-[10px] tracking-[0.14em] text-paper-faint">{String(i+1).padStart(2,'0')}</span>
              <span>{a.label}</span>
              <span className="ml-auto num text-[10px] tracking-[0.14em] text-paper-faint hidden sm:block">{a.sub}</span>
            </button>
          ))}
          {!filtered.length && <p className="num p-6 text-center text-[11px] tracking-[0.14em] text-paper-faint">No results for “{q}”</p>}
          <p className="num px-3 py-2 text-[9px] tracking-[0.18em] text-paper-faint border-t border-hairline mt-1">↑↓ to navigate · Enter to select · Esc to close</p>
        </div>
      </div>
    </>,
    document.body
  )
}
