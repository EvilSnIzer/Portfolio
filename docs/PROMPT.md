# Prompt, optimized — for this portfolio (and reusable for any 3D scroll site)

## Part A — what was wrong with the original

Six places where the brief would have cost real time or produced a worse site:

| # | The problem | Why it bites | Resolution used here |
| --- | --- | --- | --- |
| 1 | "a font like Neue Montreal, General Sans — self-hosted" | Both are commercial (Fontfabric / Casttype). "Or similar" has no free equivalent with the same tone. | **Bricolage Grotesque Variable** (SIL OFL, ships an `opsz` axis — display sizes get a genuinely tighter cut). Plus **Geist Mono Variable** for labels/numerals. Vendored as 2 woff2 files (100 kB), never a CDN. |
| 2 | "use instanced geometry" for the particle field | `THREE.Points` is already **one** draw call. `InstancedMesh` would add per-instance matrix uploads and lose the free point-sprite sizing. The instruction actively hurts. | Points + custom `ShaderMaterial`; all motion in the vertex stage. |
| 3 | "use `useProgress` from drei" for the preloader | Every mesh here is procedural and the only textures are `<img>`-sourced, so drei's counter reads `0/0` → the bar animates nothing. A fake progress bar is worse than none, and you'd never know until it shipped. | Real byte-level `fetch()` + `ReadableStream` progress over images, `document.fonts.load()` for type, and the lazy `three` chunk — with drei's `useProgress` merged in as a *second, conditional* channel. |
| 4 | "Lenis + `ScrollTrigger.scrollerProxy` integration" | `scrollerProxy` + `pin: true` is the classic rubber-banding bug; it is only needed when the scroller is a transformed container. Lenis drives *native* window scroll, so ScrollTrigger already sees correct geometry. | No proxy. Lenis drives native scroll; ScrollTrigger reads the real scrollbar; one rAF mirrors progress into a mutable store. **Still exactly one source of truth** — which was your actual requirement. |
| 5 | "skill tags rendered as floating 3D objects" | Text inside the canvas needs troika + a second font file, is not selectable, and is invisible to crawlers — directly contradicting your own accessibility/SEO clause. | Physics runs on **real DOM tags** (one rAF writing `style.transform`, zero React renders); the WebGL layer draws connective lines through the *same* coordinates. Semantic `<dl>` carries the content. |
| 6 | "a texture from a project screenshot" | With no screenshots, the Projects section either breaks or shows black plates. | Textures fail soft to a procedural gradient; DOM cards fail soft to a generated SVG plate. Section is complete with zero images. |

Missing from the original, added here: reduced-motion behaviour defined per-feature (not "disable animations"), modal focus management, the `opsz`/`font-display`/CLS detail, the deployment constraint that the app ships from a dedicated repo at the domain root (no subpath, Vercel Root Directory stays `/`), and acceptance criteria.

---

## Part B — the optimized prompt

> **Build a single-page portfolio for an AI/ML engineer: a premium, scroll-driven 3D experience in the language of high-end studios (Active Theory, Unseen, Lusion), not a Three.js demo.**
>
> **Design system**
> - Palette: off-black `#0a0a0a`, off-white `#f2f2f0`, hairlines `#232322`. **One** accent, used only on labels, active states and emissive 3D markers — warm amber `#f3a63b`. Never on body text, never a large fill.
> - Type: display face with an **optical-size axis** for contrast between headline and body (self-hosted variable woff2, OFL-licensed, ≤120 kB, `font-display: swap`, preloaded). Monospace variable face for eyebrows, counters and tabular numerals. Hero at 10–16vw, tracking −0.045em; body 15–17px at 1.7.
> - Negative space over density. Grain over gloss. The 3D layer supports the type; if a frame competes with a headline, fix the 3D.
>
> **Motion contract (the important part)**
> One scroll pipeline, no exceptions: `Lenis → native window scroll → GSAP ScrollTrigger → one mutable scroll store → camera + DOM reveals + shader uniforms`. No second scroll listener anywhere. No `scrollerProxy` (Lenis drives native scroll, so pins measure correctly). Camera and all scroll scalars come from **one scrubbed timeline** authored against document progress; `useFrame` may only *follow* those values through a frame-rate-independent damp `1 − e^(−k·dt)` — never re-derive progress.
>
> **Exactly one signature interaction:** the scroll-driven camera path. Cursor reactivity is allowed only as texture (particle repulsion, spring drift, card tilt), never as a second gimmick. No hover-to-orbit, no drag, no click-to-explode.
>
> **Structure**
> 1. **Hero** — full-viewport canvas: a few thousand points in one `THREE.Points` draw call (do **not** use InstancedMesh — points are already one call). Subtle cursor repulsion in the vertex shader. Name + rotating discipline line as DOM type on top. Scroll cue that fades with progress.
> 2. **About** — camera dollies *through* the field (that is the fly-through's whole purpose: pass near the geometry, don't just translate z). Central torus knot morphs into an organic/neural point cloud via vertex-shader blend of two equal-length vertex sets + simplex displacement that peaks mid-transition. Bio panel sits **beside**, never behind, the object.
> 3. **Skills** — real DOM tags on critically damped springs (`c = 2√k`) with gentle drift + cursor repulsion, zero React renders per frame. WebGL draws connective lines through the same coordinates. Restrained: 24 tags max, no collisions, no chaos.
> 4. **Projects** — horizontal gallery pinned by ScrollTrigger, driven by one float (`x`, 0→1) that the DOM track and the WebGL plates both consume so they cannot drift. Card = texture plane with parallax tilt (Framer Motion springs on `useMotionValue`). Click → full case study `role="dialog"`: problem → approach → stack → result, focus trapped, Esc closes, focus returns, Lenis (not `overflow:hidden`) locks scroll. Data from one typed array file; missing images fail soft to procedural plates.
> 5. **Timeline** — a CatmullRom tube that draws itself with a comet head; markers light from the *same* scalar the tube reads (no per-row triggers). Rows placed by real chronology, not array index.
> 6. **Contact** — quietest section: one line of large type, three direct links (email, `github.com/EvilSnIzer`, LinkedIn), one small emissive 3D accent object.
>
> **Preloader** — branded, with a *real* progress bar: byte-level `fetch` progress over images + `document.fonts.load()` + the lazily imported three chunk. Do not rely on drei's `useProgress` alone: procedural geometry makes it read `0/0`. Ease the displayed value, floor at ~1.1 s, fail soft on 404s, and `ScrollTrigger.refresh()` after fonts land (12vw display type changes layout height).
>
> **Performance** — budget per tier, resolved from viewport/pointer/cores + re-resolved on change: `high` 6000 points, dpr ≤1.75, one mipmap-bloom pass max; `medium` 2800, no bloom; `mobile` 900, **no fly-through — ambient orbit instead** (same scene, not a second 2D implementation); `reduced` static-ish. Additive blending with `depthWrite:false`, `antialias:false`, no shadows/envmaps/physical materials, `frameloop:'never'` on tab hide. Target: no long "Recalculate Style" blocks during a 3 s scroll record on a mid-range laptop.
>
> **Accessibility** — the canvas is `aria-hidden` + `pointer-events:none`; every word exists as semantic DOM (`<main>`, six `aria-labelledby` sections, one `<h1>`, `<dl>`/`<ol>`). Skip link first. `prefers-reduced-motion` must be defined **per feature**, not globally: Lenis off, fly-through off, particle motion ×0.2, reveals opacity-only, grain static, touch skips pointer forces. Visible 2px focus rings.
>
> **SEO** — crawlable content in the DOM (never canvas-only), title/description/canonical, OG + Twitter card with a **1200×630 PNG** generated to match the site, JSON-LD `Person`, `site.webmanifest`, no-JS boot shell painted in `index.html` so there is no white flash.
>
> **Ship as** — React + Vite + TS, `@react-three/fiber`/`drei`, GSAP + ScrollTrigger (+ SplitText, free since 3.13), Lenis, Framer Motion, Tailwind v4 `@theme` tokens. Clean separation: `content/` (all copy + data), `state/` (scroll, quality, pointer, physics), `scene/` (R3F), `sections/`, `components/`, `lib/`. Two quality switches for QA (`?reduced=1`, `?no3d=1`). README covering setup, how to swap in real projects/images, the motion contract, and what is still placeholder. Every placeholder carries a greppable `TODO`.
>
> **Build order, verifying each step before the next:** (1) hero + smooth scroll + preloader end to end → (2) camera path + About morph → (3) Skills springs → (4) Projects pin + modal → (5) Timeline → (6) Contact, grain, SEO, tier fallbacks.
>
> **Done means:** 60 fps scroll on a 4-core laptop; full text in the DOM with `?no3d=1`; no JS errors under `?reduced=1`; build green; `grep -rn TODO src/` lists exactly the fields I still need to fill.

---

## Part C — three knobs worth deciding before you build

1. **Content model first.** A short prompt that never fixes the case-study fields gets a pretty shell with nothing to say. `problem / approach[] / stack[] / result` + `metrics[]` + `year` is enough; it's what Part B encodes.
2. **"No gimmicks" needs an explicit list.** Naming what's banned (hover-orbit, drag, explode, stacked passes) does more work than naming what's wanted.
3. **Say what reduced motion *keeps*.** "Respect prefers-reduced-motion" usually becomes "animations off, page broken." Specifying *per feature* (Lenis off, motion ×0.2, opacity-only reveals) is the difference between accessible and dead.
