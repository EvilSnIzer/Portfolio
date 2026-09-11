import type { Project } from './types'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PROJECTS — the only file you need to touch to update the work section.
 *
 *  HOW TO ADD / SWAP A PROJECT
 *  1. Drop a screenshot at  public/img/<id>.png   (1600×1000, ≤ 300 KB, WebP ok)
 *  2. Add `image: '/img/<id>.jpg'` below. If the file is missing, the card
 *     falls back to a generated gradient plate — nothing breaks.
 *  3. Keep `problem / approach / stack / result` filled: the case-study panel
 *     renders those four beats and nothing else.
 *
 *  All figures below are transcribed from the GitHub profile README. Anything
 *  I could not verify from public data is marked TODO.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const projects: Project[] = [
  {
    id: 'crypto-trade-outcome-predictor',
    index: '01',
    title: 'Crypto Trade Outcome Predictor',
    subtitle: 'Time-aware ML · leakage-safe validation',
    year: '2025',
    role: 'Solo — data, modelling, evaluation, CI',
    blurb: 'Leakage-safe outcome prediction with rolling features and walk-forward CV.',
    tags: ['Python', 'scikit-learn', 'Time Series'],
    stack: [
      'Python',
      'pandas / NumPy',
      'scikit-learn',
      'pytest',
      'GitHub Actions',
      'Parquet',
    ],
    metrics: [
      // TODO: replace with your real headline metric and its baseline.
      { value: '4', label: 'models beat naive baseline' },
      { value: '100%', label: 'splits time-ordered' },
    ],
    links: { repo: 'https://github.com/EvilSnIzer/crypto-trade-outcome-predictor' },
    image: '/img/crypto-trade-outcome-predictor.jpg',
    problem:
      'Crypto outcome models are trivially easy to make look brilliant: any random forest given future-looking features will "predict" direction with frightening confidence, then collapse the moment it touches live data. The brief was to build a classifier whose reported performance survives being wrong in public.',
    approach: [
      'Rebuilt the feature set so every input is strictly t-1 available: rolling windows, realised-volatility bands, volume-z scores and returns lagged across the settlement boundary — then asserted the ordering in tests rather than trusting the author.',
      'Replaced shuffled K-fold with an expanding-window walk-forward evaluation, and kept three baselines (majority class, sign-of-last-return, logistic on price only) reported beside every model so a 2-point lift is never mistaken for a breakthrough.',
      'Added a fixed data contract (schema + dtypes) with property tests for the time index, so a silently re-sorted exchange feed fails CI instead of quietly improving accuracy.',
    ],
    result:
      'A reproducible evaluation harness: one command rebuilds features, runs every model and the baselines, and writes comparable metrics. The honest answer it produced — a modest directional edge that only clears cost assumptions in two of four regimes — is the most useful thing in the repo.',
  },
  {
    id: 'crypto-spark-pipeline',
    index: '02',
    title: 'Crypto Spark Pipeline',
    subtitle: 'Data engineering · distributed processing',
    year: '2025',
    role: 'Solo — pipeline design, Spark, Databricks',
    blurb: 'Bronze → Silver → Gold over 211K trades with partitioned Parquet.',
    tags: ['PySpark', 'Spark SQL', 'Databricks'],
    stack: ['PySpark', 'Spark SQL', 'Databricks', 'Delta/Parquet', 'Python'],
    metrics: [
      { value: '211K', label: 'synthetic trades processed' },
      { value: '3', label: 'medallion layers' },
    ],
    links: { repo: 'https://github.com/EvilSnIzer/Crypto-spark-pipeline' },
    image: '/img/crypto-spark-pipeline.jpg',
    problem:
      'Notebook-scale analysis breaks the moment the trade table outgrows a single executor and the logic that "works in the notebook" has to survive being re-run, audited and partially backfilled. I wanted a reference pipeline where each layer has one job and one owner.',
    approach: [
      'Bronze keeps raw append-only payloads with ingestion metadata — nothing cleaned, nothing dropped, so every downstream mistake is recoverable from source.',
      'Silver enforces types and dedupe keys, drops late arrivals against an explicit watermark, and writes partitioned Parquet on timestamp bucket plus symbol so common queries stop scanning history.',
      'Gold is pure SQL: sessionised trade windows, rolling VWAP, cumulative volume and per-symbol share-of-day, materialised as a thin table the BI layer reads directly.',
    ],
    result:
      'A 211K-row run that is reproducible end to end, with partition pruning turning the full-history window analytics into bounded scans, and a Silver contract that makes a bad upstream payload loud rather than expensive.',
  },
  {
    id: 'crm-analytics-funnel',
    index: '03',
    title: 'CRM Funnel Intelligence',
    subtitle: 'Business intelligence · predictive analytics',
    year: '2024',
    role: 'Solo — modelling, SQL model, Power BI',
    blurb: 'Conversion and churn analytics over 50K+ leads with a relational model.',
    tags: ['SQL', 'Python', 'Power BI'],
    stack: ['SQL', 'Python', 'pandas', 'Power BI (DAX)', 'scikit-learn'],
    metrics: [
      // TODO: swap for the real numbers from your deck if you have them.
      { value: '50K+', label: 'leads modelled' },
      { value: '5', label: 'stages instrumented' },
    ],
    links: { repo: 'https://github.com/EvilSnIzer/CRM-Analytics-Sales-Funnel-Intelligence-Dashboard' },
    image: '/img/crm-analytics-funnel.jpg',
    problem:
      'The dashboard everyone was opening in Monday standup reported a single conversion rate for a five-stage funnel, which meant it could describe a bad month but not locate one. Leadership needed stage-level drop-off with an owner attached, plus a lead score the SDR team would actually work.',
    approach: [
      'Modelled leads, activities and deals into a star schema with explicit grain per fact table, so "conversion" could not silently mean two different things in two different visuals.',
      'Built stage-transition and time-in-stage metrics in SQL, with an opportunity-level snapshot table that answers "as of the 1st" without re-running history.',
      'Trained a conversion propensity model on behaviour features (activity recency, touches-to-reply, source mix) and wrote the top decile back as a queue, then reported churn risk on the same visual as the revenue at stake.',
    ],
    result:
      'A Power BI layer where a drop-off is attributable to a stage, an owner and a cohort in under a minute, plus a prioritised follow-up queue. The relational model also made the next ask — pipeline forecasting — a query rather than a rebuild.',
  },
  {
    id: 'trading-analytics',
    index: '04',
    title: 'Trading Behaviour Analytics',
    subtitle: 'Quantitative research · market intelligence',
    year: '2024',
    role: 'Solo — analysis, notebook, report',
    blurb: 'PnL, win rate, volume and sentiment analysis across historical trades.',
    tags: ['Python', 'Pandas', 'Statistics'],
    stack: ['Python', 'pandas', 'NumPy', 'statsmodels', 'Jupyter'],
    metrics: [
      // TODO: confirm these are the numbers you want to stand behind.
      { value: '6', label: 'behavioural segments' },
      { value: 'PnL', label: 'decomposed by session' },
    ],
    links: { repo: 'https://github.com/EvilSnIzer/data-science' },
    image: '/img/trading-analytics.jpg',
    problem:
      'Aggregate PnL tells you the outcome of a trading day, never the behaviour that produced it. The question I actually cared about was which trader archetypes were profitable, and whether their edge was a real signal or just exposure to a regime.',
    approach: [
      'Normalised heterogeneous broker exports into one trade ledger, reconciled to two decimal places against statements before any analysis was trusted.',
      'Decomposed PnL by session, holding period, side and leverage, then segmented traders on those features to separate sizing behaviour from selection behaviour.',
      'Tested each segment against a regime-split baseline, and paired it with a sentiment overlay to check whether "discipline" was really just calm markets.',
    ],
    result:
      'A written analysis that put the majority of headline PnL on a handful of segments and one market regime — the kind of conclusion that is more valuable for what it quietly retires than for what it confirms.',
  },
  {
    id: 'sme-fintech-sales-ops',
    index: '05',
    title: 'SME Fintech Sales Ops',
    // TODO: fill in from the repo — this one has no public description yet.
    subtitle: 'TODO — add a one-line descriptor',
    year: 'TODO',
    role: 'TODO — your role on this',
    blurb: 'Sales operations analysis for SME lending. Placeholder entry: delete or complete.',
    tags: ['Python', 'SQL', 'TODO'],
    stack: ['Python', 'SQL'],
    links: { repo: 'https://github.com/EvilSnIzer/sme-fintech-sales-ops' },
    image: '/img/sme-fintech-sales-ops.jpg',
    problem:
      'TODO — what was broken, for whom, and why it was worth a repo. One or two sentences, written for a reader who has never heard of the client.',
    approach: [
      'TODO — step one: how you framed the problem and what you measured first.',
      'TODO — step two: the interesting technical decision, including what you rejected.',
    ],
    result: 'TODO — the number or outcome you would defend in a review.',
  },
]
