/** Shared shapes for the content files — edit `site.ts` / `projects.ts` instead. */

export type Metric = { value: string; label: string }

export type Project = {
  id: string
  index: string
  title: string
  /** One-line descriptor shown on the card face. */
  subtitle: string
  year: string
  role: string
  /** Short comma list rendered on the card. */
  blurb: string
  tags: string[]
  stack: string[]
  metrics?: Metric[]
  links: { repo?: string; demo?: string; writeup?: string }
  /** TODO: drop a real screenshot at public/img/<id>.png and it wins automatically. */
  image?: string
  /**
   * Case study — the four beats the expand panel renders in order.
   * Keep each to 1–3 sentences; the panel is typographic, not a blog.
   */
  problem: string
  approach: string[]
  result: string
  accent?: string
}

export type SkillGroup = {
  group: string
  items: { label: string; tier: number; w: number }[]
}

export type Milestone = {
  year: string
  date: string
  title: string
  org: string
  body: string
  tags?: string[]
}
