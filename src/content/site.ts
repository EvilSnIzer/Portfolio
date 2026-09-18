/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EDIT ME FIRST — all copy on the site comes from this file.
 *  Anything marked TODO has a placeholder that is safe to ship but should be
 *  replaced before you send the link to anyone.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const site = {
  name: 'Manan Sharma',
  role: 'Product Analyst · AI & Data',
  /** Rotating sub-line under the name. Keep ≤ 6, they cross-fade. */
  roles: [
    'Product Analyst',
    'AI/ML Engineer',
    'Business Analyst',
    'Data Engineer',
    'Quant Analyst',
  ],
  tagline: 'Turning complex data and AI into decisions people can act on.',
  blurb:
    'I work across product, analytics and machine learning — turning ambiguous requirements into evidence, specifications and shipped software. Equally at home in an architecture review, a competitor teardown, or writing the document a team relies on.',
  status: {
    open: true,
    label: 'Open to product & analyst roles in AI',
  },
  location: 'Delhi NCR, India · Open to relocation', // matches Product Associate roles in Pune / hybrid India
  email: 'manan.naitik@gmail.com',
  /** TODO: add a Calendly/booking link, or delete `booking`. */
  booking: null,
  links: [
    { label: 'GitHub', href: 'https://github.com/EvilSnIzer', handle: 'EvilSnIzer' },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/manan-sharma-144752201',
      handle: 'in/manan-sharma-144752201',
    },
    { label: 'Email', href: 'mailto:manan.naitik@gmail.com', handle: 'manan.naitik@gmail.com' },
  ],
} as const

export const hero = {
  /** Word-by-word mask reveal. Short beats long here. */
  line: 'Evidence in. Decisions out.',
  scrollCue: 'Scroll to fly through',
  metrics: [
    { value: '23', label: 'Public repositories' },
    { value: '211K', label: 'Trades in largest pipeline' },
    { value: '6', label: 'Disciplines in one stack' },
  ],
}

export const about = {
  eyebrow: '01 — About',
  heading: 'Products are decisions. I make them with evidence.',
  paragraphs: [
    'I work at the seam between data, engineering and the people who have to make the call. Most of my time goes into the parts that never make it into a screenshot: turning vague requirements into testable acceptance criteria, baselining before believing a metric, and writing the documents other people rely on.',
    'That means I am as comfortable sitting in an architecture discussion and capturing what was decided and why, as I am telling a stakeholder that a 4% accuracy gain is not worth the operational cost of the model that delivers it.',
    'Currently looking for a product role in enterprise AI — the kind where the job is to be useful across the whole picture rather than specialised into one slice of it.',
  ],
  principles: [
    { title: 'Signal over noise', body: 'Baselines first. A lift that does not survive them is not a lift.' },
    { title: 'Writing is the work', body: 'Most product output is a document someone relies on. Structured, short, checkable.' },
    { title: 'Explicit assumptions', body: 'Documented, tested, and falsifiable — not folklore.' },
    { title: 'Second pair of hands', body: 'Get clarity out of busy people, chase the blocker, close the loop.' },
  ],
  focus: ['Product', 'AI', 'Data', 'Analysis'],
}

export const skillsNote =
  'Tags drift on a damped spring and part around your cursor. The connective lines are the same positions, projected into the 3D layer behind the text.'

export const contactCopy = {
  eyebrow: '05 — Contact',
  heading: "Let's build something measurable.",
  body: "Best for: product and analyst roles in AI/SaaS — a second pair of hands on roadmaps, bids and evaluations, or a second opinion on a metric you don't trust yet.",
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
