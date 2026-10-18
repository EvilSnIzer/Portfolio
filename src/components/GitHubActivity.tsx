import { useEffect, useState } from 'react'

type Repo = { name:string; description:string; stargazers_count:number; language:string; html_url:string; updated_at:string }

export function GitHubActivity() {
  const [repos, setRepos] = useState<Repo[]|null>(null)
  const [err, setErr] = useState(false)
  useEffect(()=>{
    const cached = sessionStorage.getItem('gh-repos')
    if (cached) { try{ setRepos(JSON.parse(cached)); return } catch{} }
    fetch('https://api.github.com/users/EvilSnIzer/repos?per_page=6&sort=updated&direction=desc')
      .then(r=> r.ok ? r.json() : Promise.reject(r.status))
      .then((data: Repo[])=> {
        const filtered = data.filter(r=> !r.name.toLowerCase().includes('portfolio')).slice(0,6)
        setRepos(filtered)
        try{ sessionStorage.setItem('gh-repos', JSON.stringify(filtered)) } catch{}
      })
      .catch(()=> setErr(true))
  },[])
  const fallback: Repo[] = [
    { name: 'crypto-trade-outcome-predictor', description: 'Leakage-safe outcome prediction with walk-forward CV', stargazers_count: 4, language:'Python', html_url:'https://github.com/EvilSnIzer/crypto-trade-outcome-predictor', updated_at:'2025-06-01' },
    { name: 'Crypto-spark-pipeline', description: 'Bronze → Silver → Gold over 211K trades', stargazers_count: 2, language:'Python', html_url:'https://github.com/EvilSnIzer/Crypto-spark-pipeline', updated_at:'2025-05-12' },
    { name: 'CRM-Analytics-Sales-Funnel', description: '50K+ leads modelled into a Power BI funnel', stargazers_count: 3, language:'TSQL', html_url:'https://github.com/EvilSnIzer/CRM-Analytics-Sales-Funnel-Intelligence-Dashboard', updated_at:'2024-09-20' },
  ]
  const list = repos?.length ? repos : err ? fallback : null
  return (
    <section aria-labelledby="gh-title" className="mx-auto w-full max-w-[1600px] px-5 sm:px-8 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow flex items-center gap-2"><span className="h-px w-6 bg-accent" aria-hidden /> Live from GitHub</p>
          <h2 id="gh-title" className="display-sm mt-3 text-[26px] sm:text-[32px]">Pinned repositories</h2>
        </div>
        <a href="https://github.com/EvilSnIzer" target="_blank" rel="noreferrer" className="num inline-flex items-center gap-1.5 rounded-full border border-hairline bg-ink-soft px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-paper-faint transition-colors hover:border-paper/20 hover:text-paper">View all ↗</a>
      </div>
      {!list ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {Array.from({length:3}).map((_,i)=> <div key={i} className="h-[130px] animate-pulse rounded-2xl border border-hairline bg-ink-soft" />)}
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {list.map(r=> (
            <li key={r.name} className="group rounded-2xl border border-hairline bg-ink-soft p-6 transition-all hover:border-hairline-strong hover:bg-ink-raised hover:shadow-lg hover:-translate-y-1">
              <a href={r.html_url} target="_blank" rel="noreferrer" className="block">
                <div className="flex items-center justify-between">
                  <span className="num inline-flex items-center gap-1.5 rounded-full bg-ink-raised px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-paper-faint">{r.language || '—'} · ★ {r.stargazers_count}</span>
                  <span className="grid h-7 w-7 place-items-center rounded-full border border-hairline text-[11px] text-paper-faint transition-all group-hover:bg-paper group-hover:text-ink">↗</span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold leading-[1.25] tracking-[-0.02em] text-paper group-hover:text-accent transition-colors line-clamp-2">{r.name}</h3>
                <p className="mt-2 line-clamp-2 text-[13px] leading-[1.6] text-paper-dim">{r.description || 'No description'}</p>
                <p className="num mt-4 text-[9px] uppercase tracking-[0.14em] text-paper-faint">{new Date(r.updated_at).toLocaleDateString('en-US',{month:'short',year:'numeric'})} · View code</p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
