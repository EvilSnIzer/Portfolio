import { useEffect, useState } from 'react'

type Repo = { name:string; description:string; stargazers_count:number; language:string; html_url:string; updated_at:string; topics?:string[] }

export function GitHubActivity() {
  const [repos, setRepos] = useState<Repo[]|null>(null)
  const [err, setErr] = useState(false)

  useEffect(()=>{
    const cached = sessionStorage.getItem('gh-repos')
    if (cached) { try{ setRepos(JSON.parse(cached)); return } catch{} }
    fetch('https://api.github.com/users/EvilSnIzer/repos?per_page=6&sort=updated&direction=desc')
      .then(r=> r.ok ? r.json() : Promise.reject(r.status))
      .then((data: Repo[])=> {
        // filter out portfolio itself, keep most interesting
        const filtered = data.filter(r=> !r.name.toLowerCase().includes('portfolio')).slice(0,6)
        setRepos(filtered)
        try{ sessionStorage.setItem('gh-repos', JSON.stringify(filtered)) } catch{}
      })
      .catch(()=> setErr(true))
  },[])

  // fallback static data if rate-limited
  const fallback: Repo[] = [
    { name: 'crypto-trade-outcome-predictor', description: 'Leakage-safe outcome prediction with walk-forward CV', stargazers_count: 4, language:'Python', html_url:'https://github.com/EvilSnIzer/crypto-trade-outcome-predictor', updated_at:'2025-06-01' },
    { name: 'Crypto-spark-pipeline', description: 'Bronze → Silver → Gold over 211K trades — PySpark', stargazers_count: 2, language:'Python', html_url:'https://github.com/EvilSnIzer/Crypto-spark-pipeline', updated_at:'2025-05-12' },
    { name: 'CRM-Analytics-Sales-Funnel', description: '50K+ leads modelled into a Power BI funnel', stargazers_count: 3, language:'PowerShell', html_url:'https://github.com/EvilSnIzer/CRM-Analytics-Sales-Funnel-Intelligence-Dashboard', updated_at:'2024-09-20' },
  ]

  const list = repos?.length ? repos : err ? fallback : null

  return (
    <section aria-labelledby="gh-title" className="mx-auto w-full max-w-[1600px] px-5 sm:px-8 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">★ GitHub — live</p>
          <h2 id="gh-title" className="display-sm mt-3 text-[24px] sm:text-[30px]">Pinned repositories</h2>
        </div>
        <a href="https://github.com/EvilSnIzer" target="_blank" rel="noreferrer" className="num text-[10px] uppercase tracking-[0.2em] text-paper-faint hover:text-paper">View all on GitHub ↗</a>
      </div>
      {!list ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {Array.from({length:3}).map((_,i)=> <div key={i} className="h-[120px] animate-pulse border border-hairline bg-ink-soft" />)}
        </div>
      ) : (
        <ul className="mt-8 grid gap-px border border-hairline bg-hairline sm:grid-cols-3">
          {list.map(r=> (
            <li key={r.name} className="group bg-ink-soft p-5 transition-colors hover:bg-ink-raised">
              <a href={r.html_url} target="_blank" rel="noreferrer" className="block">
                <p className="num text-[10px] uppercase tracking-[0.14em] text-accent truncate">{r.language || '—'} · ★ {r.stargazers_count}</p>
                <h3 className="mt-2 text-[15px] font-semibold leading-[1.2] text-paper group-hover:text-accent transition-colors" style={{letterSpacing:'-0.02em'}}>{r.name}</h3>
                <p className="mt-2 line-clamp-2 text-[13px] leading-[1.6] text-paper-dim">{r.description || 'No description'}</p>
                <p className="num mt-3 text-[9px] uppercase tracking-[0.14em] text-paper-faint">{new Date(r.updated_at).toLocaleDateString('en-US',{month:'short',year:'numeric'})} · View ↗</p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
