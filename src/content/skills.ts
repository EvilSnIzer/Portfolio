import type { SkillGroup } from './types'

/**
 * Skills. `tier` drives how far out a tag floats in the 3D field (0 = centre),
 * `w` is its spring mass multiplier. Keep total tags ≤ 24 or the horizontal
 * drift starts reading as noise instead of choreography.
 *
 * Current balance is tuned for product/analyst applications at AI consultancies:
 * Product sits at the centre, AI and data fluency backs it up, engineering
 * closes the ring. Keep every tag honest — each one maps to work in /projects.
 */
export const skillGroups: SkillGroup[] = [
  {
    group: 'Product',
    items: [
      { label: 'User Stories & AC', tier: 0, w: 1.2 },
      { label: 'Roadmapping', tier: 0, w: 1.1 },
      { label: 'Competitive Analysis', tier: 1, w: 0.95 },
      { label: 'Stakeholder Comms', tier: 1, w: 0.95 },
      { label: 'Bids & Tenders', tier: 2, w: 0.8 },
    ],
  },
  {
    group: 'AI / ML',
    items: [
      { label: 'Python', tier: 0, w: 1.25 },
      { label: 'scikit-learn', tier: 1, w: 1 },
      { label: 'RAG Pipelines', tier: 1, w: 0.95 },
      { label: 'LLM Evaluation', tier: 1, w: 0.9 },
      { label: 'Time Series', tier: 2, w: 0.85 },
    ],
  },
  {
    group: 'Data / Analytics',
    items: [
      { label: 'SQL', tier: 0, w: 1.15 },
      { label: 'PySpark', tier: 1, w: 1 },
      { label: 'Power BI', tier: 1, w: 0.95 },
      { label: 'Statistics', tier: 2, w: 0.85 },
      { label: 'Pandas', tier: 2, w: 0.8 },
    ],
  },
  {
    group: 'Software',
    items: [
      { label: 'REST APIs', tier: 0, w: 1.05 },
      { label: 'Docker', tier: 1, w: 0.9 },
      { label: 'React', tier: 1, w: 0.9 },
      { label: 'GitHub Actions', tier: 2, w: 0.8 },
      { label: 'Cloud Services', tier: 2, w: 0.8 },
    ],
  },
]

export const allSkills = skillGroups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })))
