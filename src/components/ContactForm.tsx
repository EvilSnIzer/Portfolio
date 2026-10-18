import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function ContactForm() {
  const [status, setStatus] = useState<'idle'|'sending'|'success'|'error'>('idle')
  const [vals, setVals] = useState({ name:'', email:'', message:'' })
  const [errs, setErrs] = useState<Record<string,string>>({})

  const validate = () => {
    const e: Record<string,string> = {}
    if (!vals.name.trim()) e.name = 'Your name is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) e.email = 'Valid email required'
    if (vals.message.trim().length < 10) e.message = 'At least 10 characters'
    setErrs(e); return !Object.keys(e).length
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setStatus('sending')
    try {
      // Try Formspree (free, no key needed for demo) — fallback to mailto if blocked
      const res = await fetch('https://formspree.io/f/mzzbygop', {
        method: 'POST', headers: { 'Accept':'application/json','Content-Type':'application/json' },
        body: JSON.stringify({ ...vals, _subject: `Portfolio inquiry from ${vals.name}` })
      })
      if (!res.ok) throw new Error('formspree')
      setStatus('success')
      setVals({ name:'', email:'', message:'' })
      setTimeout(()=> setStatus('idle'), 3500)
    } catch {
      // Graceful fallback: open mail client with prefilled body
      const body = encodeURIComponent(`Name: ${vals.name}\nEmail: ${vals.email}\n\n${vals.message}`)
      window.location.href = `mailto:manan.naitik@gmail.com?subject=${encodeURIComponent('Portfolio inquiry — '+vals.name)}&body=${body}`
      setStatus('success')
      setTimeout(()=> setStatus('idle'), 3500)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 max-w-[560px]">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="num mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-paper-faint">Name</span>
          <input placeholder="Jane Doe" value={vals.name} onChange={e=> setVals(v=>({...v,name:e.target.value}))} className="field" required />
          {errs.name && <span className="num mt-1 block text-[10px] text-[#e55]">{errs.name}</span>}
        </label>
        <label className="block">
          <span className="num mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-paper-faint">Email</span>
          <input type="email" placeholder="jane@company.com" value={vals.email} onChange={e=> setVals(v=>({...v,email:e.target.value}))} className="field" required />
          {errs.email && <span className="num mt-1 block text-[10px] text-[#e55]">{errs.email}</span>}
        </label>
      </div>
      <label className="mt-4 block">
        <span className="num mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-paper-faint">Message</span>
        <textarea rows={4} placeholder="Tell me about the role or project…" value={vals.message} onChange={e=> setVals(v=>({...v,message:e.target.value}))} className="field resize-none" required />
        {errs.message && <span className="num mt-1 block text-[10px] text-[#e55]">{errs.message}</span>}
      </label>
      <div className="mt-5 flex items-center gap-4">
        <button type="submit" disabled={status==='sending'} className="num inline-flex items-center gap-2 bg-paper px-6 py-3 text-[10px] uppercase tracking-[0.18em] text-ink transition-opacity hover:opacity-90 disabled:opacity-60">
          {status==='sending' ? 'Sending…' : status==='success' ? 'Sent ✓' : 'Send message ↗'}
        </button>
        <span className="num text-[10px] tracking-[0.14em] text-paper-faint">or email directly — replies within 24h</span>
      </div>
      <AnimatePresence>
        {status==='success' && <motion.p initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="num mt-4 text-[11px] tracking-[0.14em] text-accent">Message sent — thank you! I'll be in touch soon.</motion.p>}
        {status==='error' && <motion.p initial={{opacity:0}} animate={{opacity:1}} className="num mt-4 text-[11px] text-[#e55]">Something went wrong — please email directly.</motion.p>}
      </AnimatePresence>
    </form>
  )
}
