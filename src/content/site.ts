/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EDIT ME FIRST — all copy on the site comes from this file.
 *  Anything marked TODO has a placeholder that is safe to ship but should be
 *  replaced before you send the link to anyone.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const site = {
  name: 'Manan Sharma',
  role: 'AI/ML Engineer',
  /** Rotating sub-line under the name. Keep ≤ 6, they cross-fade. */
  roles: [
    'AI/ML Engineer',
    'Quant & Market Analyst',
    'Data Engineer',
    'Business Analyst',
    'Software Engineer',
  ],
  tagline: 'Engineering intelligence for data, markets and software.',
  blurb:
    'I build practical systems across machine learning, quantitative analysis, data engineering and software — turning complex information into something measurable, reproducible and useful.',
  status: {
    open: true,
    label: 'Open to ML / data engineering roles',
  },
  location: 'India · Remote-friendly', // TODO: confirm your preferred display
  /** TODO: replace with a real, monitored inbox before publishing. */
  email: 'hello@manansharma.dev',
  /** TODO: add a Calendly/booking link, or delete `booking`. */
  booking: null,
  links: [
    { label: 'GitHub', href: 'https://github.com/EvilSnIzer', handle: 'EvilSnIzer' },
    {
      label: 'LinkedIn',
      // TODO: replace with your full LinkedIn profile URL.
      href: 'https://www.linkedin.com/in/manan-sharma',
      handle: 'in/manan-sharma',
    },
    { label: 'Email', href: 'mailto:hello@manansharma.dev', handle: 'hello@manansharma.dev' },
  ],
} as const

export const hero = {
  /** Word-by-word mask reveal. Short beats long here. */
  line: 'Systems that keep working after the demo.',
  scrollCue: 'Scroll to fly through',
  metrics: [
    { value: '23', label: 'Public repositories' },
    { value: '211K', label: 'Trades in largest pipeline' },
    { value: '6', label: 'Disciplines in one stack' },
  ],
}

export const about = {
  eyebrow: '01 — About',
  heading: 'Reliable data → rigorous evaluation → useful software.',
  paragraphs: [
    'I work at the seam between models and decisions. Most of my time goes into the parts that never make it into a screenshot: leakage-safe feature engineering, walk-forward validation, schemas that survive the next upstream change, tests that fail before a customer does.',
    'That means I am as comfortable writing a PySpark Bronze → Silver → Gold pipeline as I am explaining to a stakeholder why a 4% accuracy gain is not worth the operational cost of the model that delivers it.',
    'Currently exploring agentic systems and quantitative intelligence — with a bias toward tooling I can delete in an afternoon.',
  ],
  principles: [
    { title: 'Reproducibility', body: 'Same inputs, same numbers, without me in the room.' },
    { title: 'Leakage paranoia', body: 'Time-aware splits, baselines, honest evaluation windows.' },
    { title: 'Explicit assumptions', body: 'Documented, tested, and falsifiable — not folklore.' },
    { title: 'Understandable systems', body: 'The demo is the easy part. Six months later is the test.' },
  ],
  focus: ['Intelligence', 'Markets', 'Data', 'Software'],
}

export const skillsNote =
  'Tags drift on a damped spring and part around your cursor. The connective lines are the same positions, projected into the 3D layer behind the text.'

export const contactCopy = {
  eyebrow: '05 — Contact',
  heading: "Let's build something measurable.",
  body: 'Best for: ML pipelines, data platform work, quant research tooling, or a second opinion on an evaluation you do not trust yet.',
}

/**
 * Preload manifest. `assets.loadAssets()` fetches each entry and feeds the
 * preloader bar, so this must stay in sync with the images actually imported
 * by src/content/projects.ts and the scene.
 */
export const assets = {
  images: (): string[] => {
    // Populated lazily by loadAssets via the project thumbnails it imports.
    return []
  },
  fonts: [
    "700 96px 'Bricolage Grotesque'",
    "600 24px 'Bricolage Grotesque'",
    "500 12px 'Geist Mono'",
  ],
}
