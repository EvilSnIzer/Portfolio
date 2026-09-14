import type { SkillGroup } from './types'

/**
 * Skills. `tier` drives how far out a tag floats in the 3D field (0 = centre),
 * `w` is its spring mass multiplier. Keep total tags ≤ 24 or the horizontal
 * drift starts reading as noise instead of choreography.
 */
export const skillGroups: SkillGroup[] = [
  {
    group: 'AI / ML',
    items: [
      { label: 'Python', tier: 0, w: 1.25 },
      { label: 'scikit-learn', tier: 1, w: 1 },
      { label: 'Pandas', tier: 1, w: 0.9 },
      { label: 'NumPy', tier: 2, w: 0.8 },
      { label: 'Time Series', tier: 0, w: 1.1 },
      { label: 'Feature Engineering', tier: 2, w: 0.85 },
      { label: 'Walk-Forward CV', tier: 2, w: 0.85 },
    ],
  },
  {
    group: 'Data / Quant',
    items: [
      { label: 'PySpark', tier: 0, w: 1.2 },
      { label: 'Spark SQL', tier: 1, w: 1 },
      { label: 'Databricks', tier: 1, w: 0.95 },
      { label: 'Parquet', tier: 2, w: 0.8 },
      { label: 'SQL', tier: 0, w: 1.15 },
      { label: 'Statistics', tier: 2, w: 0.85 },
      { label: 'Market Microstructure', tier: 2, w: 0.8 },
    ],
  },
  {
    group: 'Software',
    items: [
      { label: 'Docker', tier: 1, w: 0.9 },
      { label: 'REST APIs', tier: 2, w: 0.8 },
      { label: 'React', tier: 0, w: 1.05 },
      { label: 'Node.js', tier: 1, w: 0.9 },
      { label: 'GitHub Actions', tier: 2, w: 0.8 },
      { label: 'Testing', tier: 2, w: 0.85 },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { label: 'Power BI', tier: 1, w: 0.95 },
      { label: 'Business Intelligence', tier: 2, w: 0.8 },
      { label: 'Automation', tier: 2, w: 0.8 },
      { label: 'Sales Operations', tier: 2, w: 0.75 },
    ],
  },
]

export const allSkills = skillGroups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })))
