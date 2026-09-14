# Manan Sharma — Portfolio

A single-page, scroll-driven 3D portfolio. React + Vite, Three.js via
`@react-three/fiber`, GSAP ScrollTrigger, Lenis, Framer Motion, Tailwind v4.

The site is one continuous camera move through a particle field, with real DOM
content on top of it. Text is never painted inside the canvas, so screen readers,
Google and a page with WebGL disabled all get the same document.

---

## Quick start

```bash
npm install          # see "Install note" below about .npmrc
npm run dev          # http://localhost:5173
npm run build        # → dist/
npm run preview      # serves the production build
```

Requires Node ≥ 20.11.

**Install note.** `.npmrc` sets `legacy-peer-deps=true`. Without it, npm
tries to satisfy `@react-three/fiber`'s *optional* React-Native/Expo peers and the
install dies with an ERESOLVE error. If you remove the flag, install with
`npm i --legacy-peer-deps`.

### Useful URL switches

| URL | What it does |
| --- | --- |
| `?reduced=1` | Forces `prefers-reduced-motion`: no Lenis, no camera fly-through, no grain animation, reveals become opacity-only |
| `?no3d=1` | Skips mounting the WebGL layer entirely — the page must still read perfectly. This is the fallback every crawler sees |

---

## Editing content

Everything textual lives in `src/content/`. No component needs to be touched.

| File | Owns |
| --- | --- |
| `src/content/site.ts` | Name, roles, tagline, location, email, social links, About copy, principles, contact copy |
| `src/content/projects.ts` | The horizontal gallery + case-study panels |
| `src/content/skills.ts` | Toolkit tags (and how far out each one floats) |
| `src/content/timeline.ts` | Trajectory milestones |
| `src/content/types.ts` | Shapes, if you want to add a field |

### Swap in real project data

1. Open `src/content/projects.ts`. Each entry is typed (`Project` in
   `src/content/types.ts`); your editor will tell you what is missing.
2. Fill the four beats that the case-study panel renders — `problem`,
   `approach[]`, `stack[]`, `result`. The panel renders nothing else, so a
   project is "done" when those four are honest.
3. Add `metrics` (max 4) for the stat strip.
4. Add a screenshot: save it as `public/img/<id>.png` where `<id>` matches the
   entry's `id`, and point `image` at it. See `public/img/README.md` for size
   guidance. A missing file does **not** break anything: the DOM card falls back
   to a procedural SVG plate and the WebGL texture falls back to a gradient.
5. Delete the placeholder entry (`sme-fintech-sales-ops`) or finish it — it ships
   with `TODO` markers on purpose so you can `grep -rn TODO src/` before publishing.

Anything still holding `TODO` shows a small amber warning inside that project's
case-study panel, so placeholders can't sneak onto a recruiter's screen.

### Timeline dates

`date` must be sortable ISO (`YYYY-MM`) — the 3D tube places its markers by real
chronology, not array index, so out-of-order dates light up in the wrong order.

---

## How the motion works (read before adding a section)

There is **one** scroll pipeline and it is deliberately boring:

```
Lenis  ──▶  window.scrollY  ──▶  GSAP ScrollTrigger  ──▶  scroll.{progress,section}
                                            │
                                            ├──▶ sceneState.{cam,look,values}  ──▶ camera (useFrame)
                                            └──▶ DOM reveals / marker states
```

* **Lenis** drives native window scroll. ScrollTrigger therefore reads the real
  scrollbar, which is why `ScrollTrigger.scrollerProxy` is *not* used: proxy +
  `pin: true` is the classic recipe for rubber-banding, and it buys nothing here.
  One `initScroll()` owns Lenis' rAF; nothing else listens to `scroll`.
* **`src/scene/scenePath.js`** is the camera choreography: nine keyframes authored
  against *document progress* (0→1). Because positions and sections share that one
  axis, the WebGL journey and the DOM can't drift.
* **Per-section progress** comes from `useSectionProgress(id)`, which writes
  `scroll.section[id]`. Sections read it; they never compute it themselves.
* **Shaders never receive per-frame CPU work.** Scroll values are uploaded as
  uniforms; particle drift, cursor repulsion and the morph all happen in the vertex
  stage.

### Adding a section

1. Add it to `sections[]` in `src/state/scroll.js` (nav, `scroll.active` and the
   index labels read from there).
2. Create `src/sections/MySection.tsx`, call `useSectionProgress('mine')`, and tag
   animatable elements with `data-reveal`.
3. Mount it inside `<main>` in `src/App.tsx`.
4. Add one or two keyframes to `cameraPath` in `src/scene/scenePath.js` at the
   progress where your section lives. If you move sections around, this is the only
   file that needs re-tuning.

### The one-interaction rule

The scroll-driven camera path is the only signature 3D interaction. The cursor
reactivity (particle repulsion, skill-tag springs, plate tilt) exists to make the
scene feel physical, not to be a second gimmick. Before adding any new interaction
— hover-to-orbit, drag, click-to-explode, a second pinned scroll — ask what the
camera path loses. If the answer is "nothing", don't add it.

More detail in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

---

## Performance

Current production output (measured with `npm run build`):

| Chunk | Raw | gzip | Notes |
| --- | --- | --- | --- |
| `index` | 397 kB | 126 kB | Critical path: React, Framer Motion, GSAP, all DOM |
| `r3f` | 988 kB | 263 kB | three + drei + R3F. **Lazily imported**, never blocks first paint |
| `motion` | 139 kB | 52 kB | GSAP + Lenis, shared |
| `EffectsBloom` | 0.3 kB | – | Split out; only fetched on the `high` tier |
| fonts | 100 kB | – | Two self-hosted variable woff2 (Bricolage Grotesque, Geist Mono) |

Choices that keep a mid-range laptop at 60 fps:

* **Quality tiers** (`src/state/quality.js`): `high` / `medium` / `mobile` /
  `reduced`, resolved from viewport, pointer type, cores and `prefers-reduced-motion`,
  then re-resolved on change. Particles go 6000 → 2800 → 900; `dpr` is capped
  (1.75 desktop, 1.3 mobile); bloom runs only on `high`.
* **One post-processing pass, max.** Only mipmap bloom, and only on the high tier.
  Film grain is a composited CSS layer, not a shader, so it costs nothing on the GPU
  and still covers the text (which is what makes it read as film instead of plastic).
* Single draw call per object, additive blending with `depthWrite:false`, no
  shadows, no environment maps, no `MeshPhysicalMaterial`.
* `antialias: false` — at `dpr ≥ 1.35` on soft additive particles MSAA buys nothing.
* `frameloop` switches to `never` when the tab hides.
* Skill tags are moved by direct `style.transform` writes inside one rAF loop — zero
  React renders per frame.
* No `window.addEventListener('scroll')` anywhere in `src/`.

To check it yourself: DevTools → Performance, record a 3-second scroll, and look for
long "Recalculate Style" blocks. If you see them, you have a layout write in a rAF
loop — batch it with the pattern used in `src/state/skills.ts`.

---

## Accessibility

* The canvas wrapper is `aria-hidden="true"` + `pointer-events:none`; every word a
  human needs is a real `<h1>`/`<h2>`/`<p>`/`<dl>`/`<ol>`.
* Six sections are six `<section>` elements, each `aria-labelledby` its own heading,
  inside one `<main>`. A skip-link is the first focusable element.
* Case study is a real `role="dialog"`: focus moves in, Tab is trapped, Esc closes,
  focus returns to the card, scroll is locked through Lenis (not `overflow:hidden`,
  which would jump the page).
* `prefers-reduced-motion` disables Lenis, the camera fly-through, particle motion
  and the grain animation. Reveals become opacity-only. Scroll still works natively.
* On touch, `pointer` reactivity is skipped entirely and the projects rail becomes a
  native `scroll-snap` row instead of a pinned transform.
* Focus rings are 2px accent, `outline-offset: 3px`.

---

## Deploy to Vercel

This repo *is* the site, so Vercel works with zero configuration: import
`EvilSnIzer/Portfolio`, leave **Root Directory** at its default (`/`), and deploy.
The framework auto-detects Vite, and `vercel.json` supplies the build command
(`npm run build`), install command (`npm ci --legacy-peer-deps`), `dist` output,
immutable asset caching, and security headers.

**CLI:**

```bash
npx vercel --prod
```

Then update `index.html`'s canonical + `og:url` (search for `manansharma.dev`) to
your real domain, and set `VERCEL_URL`-independent absolute OG URLs — social
crawlers cannot resolve relative ones.

---

## Stack, and why

| | |
| --- | --- |
| React 19 + Vite 8 | Fast dev loop; `manualChunks` keeps `three` off the critical path |
| @react-three/fiber 9 + drei 10 | Declarative scene graph; drei used narrowly (`useProgress`) |
| GSAP + ScrollTrigger + SplitText | One scrubbed timeline for the camera; SplitText for the type reveal (free since GSAP 3.13) |
| Lenis 1.3 | Smoothing only — it does not own scroll progress |
| Framer Motion 13 | DOM micro-interactions: card tilt, modal, nav |
| Tailwind 4 | Layout/typography via `@theme` tokens; no config file needed |
| Bricolage Grotesque Variable | Self-hosted, OFL. Has an `opsz` axis — display sizes get a tighter cut, body stays open. Closest free analogue to Neue Montreal / General Sans |
| Geist Mono Variable | Labels and numbers; the tabular figures carry the "terminal" tone |

Accent is warm amber (`#f3a63b`) on off-black `#0a0a0a` / off-white `#f2f2f0`. It is
used for labels, active states and emissive 3D markers only — never for body text
or large fills.

---

## Things deliberately left as TODO

* `site.ts` → real email, LinkedIn URL, location. `booking` is `null`.
* `projects.ts` → the fifth entry is a scaffold; metrics are partly inferred.
* `timeline.ts` → dates are inferred from public repo activity. Replace with your
  actual education/employment record; recruiters read this section hardest.
* `index.html` → `manansharma.dev` is a placeholder domain in canonical/OG/JSON-LD.
* `public/img/*.png` → four generated abstract plates stand in for real screenshots.
  They look intentional, but your actual UI will always beat them.
