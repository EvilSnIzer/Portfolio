import type { Milestone } from './types'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TIMELINE — `date` must be sortable ISO (YYYY-MM) so the 3D curve can place
 *  markers by true chronological position, not array index.
 *
 *  ⚠  Everything below is inferred from public repository activity or is a
 *  TODO. Replace with your actual education/employment record before
 *  publishing — recruiters read this section more carefully than any other.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const timeline: Milestone[] = [
  {
    year: '2026',
    date: '2026-01',
    title: 'TODO — current role / open to work',
    org: 'TODO — company or "Independent"',
    body: 'Currently going deeper on agentic systems and quantitative intelligence: tooling that lets a model explain itself in the same interface where the decision gets made.',
    tags: ['AI Engineering', 'Agentic Systems'],
  },
  {
    year: '2025',
    date: '2025-05',
    title: 'Crypto Trade Outcome Predictor',
    org: 'Independent research',
    body: 'Time-aware ML with rolling features, walk-forward validation, baselines and CI — built to survive being wrong in public, not to win a demo.',
    tags: ['scikit-learn', 'Validation', 'CI'],
  },
  {
    year: '2025',
    date: '2025-02',
    title: 'Distributed trade pipeline',
    org: 'PySpark · Databricks',
    body: 'Bronze → Silver → Gold over 211K trades: partitioned Parquet, window analytics, an ingestion contract that makes bad payloads loud instead of expensive.',
    tags: ['PySpark', 'Spark SQL', 'Parquet'],
  },
  {
    year: '2024',
    date: '2024-09',
    title: 'CRM funnel intelligence',
    org: 'Business intelligence',
    body: '50K+ leads modelled into a star schema with stage-level conversion, churn analysis and a propensity queue the sales team actually worked.',
    tags: ['SQL', 'Power BI', 'Prediction'],
  },
  {
    year: '2024',
    date: '2024-03',
    title: 'Trader behaviour segmentation',
    org: 'Quantitative analysis',
    body: 'PnL decomposed by session, holding period and leverage, then segmented to separate sizing behaviour from selection behaviour against a regime-split baseline.',
    tags: ['Python', 'Statistics'],
  },
  {
    year: '2022',
    date: '2022-01',
    title: 'First public repositories',
    org: 'github.com/EvilSnIzer',
    body: 'Python, MERN and automation experiments — the beginning of a habit of shipping small reproducible things in public.',
    tags: ['Python', 'JavaScript'],
  },
]
