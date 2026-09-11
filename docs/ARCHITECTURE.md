# Architecture notes

Three things earn their complexity on this site: the scroll pipeline, the quality
tiering, and the fact that the WebGL layer is *derived* from the DOM instead of
being a parallel source of truth. Everything else is deliberately ordinary React.

## 1. Scroll pipeline

```
                 ┌──────────────────────────────────────────────┐
                 │  one rAF loop  (src/state/scroll.js)         │
                 │  Lenis.raf → dampPointer → read window       │
                 └───────────────┬──────────────────────────────┘
                                 │ writes
                        scroll.{progress,y,velocity,section,active}
                                 │
        ┌────────────────────────┼───────────────────────────┐
        │                        │                           │
  Nav (120ms poll)      useSectionProgress          GSAP ScrollTrigger
  active section          per-section 0→1             pin / horizontal / camera
                                │                           │
                                └──────────┬────────────────┘
                                           │ writes
                          sceneState.{cam,look,values,nodes,projects}
                                           │
                                    R3F useFrame (read-only)
```

Rules this enforces:

1. **Nothing reads `window.scrollY` except `initScroll`'s tick.** Components read
   the `scroll` store. (`Nav` polls it at 8 Hz — a poll of an existing number is
   cheaper than a second scroll pipeline, and it cannot desync.)
2. **Lenis drives native scroll; ScrollTrigger is *not* proxied.** Lenis calls
   `window.scrollTo`, so ScrollTrigger sees ordinary scrollbar geometry and
   `pin: true` measures correctly. `ScrollTrigger.scrollerProxy` is only needed when
   the scroller is a transformed container — with it, pins need `scrollerSnap`
   gymnastics and horizontal sections drift. This is the one place the brief's
   literal instruction was improved rather than followed; see the prompt doc.
3. **The Projects rail and its 3D plates read the same float.** `sceneState.projects.x`
   is written by the pin's `onUpdate`; the DOM track is translated by `-x·distance`
   and the WebGL group by `+x·SPAN`. There is no sync step, so no drift.
4. **Timeline markers light from `values.tube`, not from their own triggers.** Six
   ScrollTriggers for six rows would be six more measurement passes, and they'd be
   able to disagree with the tube.

## 2. Quality tiers

`src/state/quality.js` resolves one of `high | medium | mobile | reduced` from
`(max-width)`, `(pointer: coarse)`, `(update: slow)`, `hardwareConcurrency` and
`prefers-reduced-motion`, then re-resolves on any of those changing.

| | high | medium | mobile | reduced |
| --- | --- | --- | --- | --- |
| particles | 6000 | 2800 | 900 | 900 |
| camera fly-through | ✓ | ✓ | – | – |
| bloom | ✓ | – | – | – |
| dpr cap | 1.75 | 1.5 | 1.3 | 1.35 |
| particle motion | 1.0 | 1.0 | 1.0 | 0.22 |
| reveals | transform+opacity | same | same | opacity only |
| Lenis | ✓ | ✓ | ✓ | – |
| pointer forces | ✓ | ✓ | – (no hover) | – |

Mobile does **not** get a separate 2D fallback: the same scene renders with 15% of
the particles, no fly-through, and an ambient orbit. That is cheaper than maintaining
a second visual language and still looks intentional. If you want the 2D variant, the
seam already exists — `SceneShell` returns `null` when `no3d`/no-WebGL, and every
section is written to be complete without the canvas.

## 3. Preloader honesty

`src/lib/assets.ts` fetches the real payload: project images via `fetch()` with
`ReadableStream` byte accounting, the two variable-font files via
`document.fonts.load()`, and the lazy `CanvasRoot` chunk (so `three` is warm before
handover). `useProgress` from drei is wired in as a second channel
(`SceneProgressReporter` → `setR3FProgress`) and only constrains the bar if it is
actually tracking something.

Why not `useProgress` alone: every mesh on this page is generated procedurally and
the only textures come from `<img>` elements, so drei's counter would read `0/0` and
the "premium detail" you asked for would be a fake bar. A preloader that reports
nothing is worse than no preloader.

Details that matter and are easy to skip:
* the bar's *displayed* value is time-eased and never falls behind by more than it can
  recover, so it doesn't sit at 94% for two seconds;
* a 404 image resolves with a warning and a synthetic byte count, so a missing
  screenshot can never hang the loader;
* a `minMs` floor prevents the "flash of preloader" on a warm cache;
* fonts are loaded before `ScrollTrigger.refresh()` because 12vw display type changes
  layout height, and a stale pin measurement is very visible.

## 4. Adding post-processing (only if the budget allows)

`src/scene/EffectsBloom.tsx` is intentionally the *only* pass, and it is behind a lazy
import so the `high` tier is the only one that pays for it. If you add a second pass:

1. stay inside one `<EffectComposer multisampling={0}>` — two composers = two full
   framebuffer chains;
2. prefer `mipmapBlur` bloom over kernel-sampled bloom;
3. never add SMAA/FXAA on top of a dpr cap ≥ 1.5;
4. measure on a 2-year-old laptop with a 4-core CPU, not your dev machine, and check
   the GPU column in a Performance recording — the pass cost is fill-rate bound, so
   a fullscreen window on a 5K display is a different app than a windowed one.

If a pass pushes you under 55 fps during a scrub, delete it rather than lowering
quality — the scroll feel *is* the design here.

## 5. Files worth knowing

| Path | Owns |
| --- | --- |
| `src/state/scroll.js` | Lenis + the store + `scrollToSection` + scroll locking |
| `src/state/quality.js` | Tier resolution, particle budget |
| `src/state/pointer.js` | Normalised pointer + damping (shared DOM/WebGL) |
| `src/state/skills.ts` | Spring physics for tags; mirrors positions to `sceneState.nodes` |
| `src/lib/motion.js` | `useSectionProgress`, `useReveal`, `useSplitWords`, `useCountUp` |
| `src/lib/assets.ts` | Preload manifest + byte progress + the two-channel merge |
| `src/scene/scenePath.js` | The nine camera keyframes — the choreography file |
| `src/scene/sceneState.js` | The DOM↔WebGL contract (one field per writer) |
| `src/scene/glsl.js` | Simplex noise + the runtime sprite canvas |

## 6. Known trade-offs

* **Camera keyframes are authored against document progress**, so they are precise but
  coupled to section heights. Move/resize sections materially and `scenePath.js` needs
  a re-tune. The alternative (deriving positions from measured section offsets) makes
  the choreography mushy and re-measures on every image load; the authored version is
  the right call for a six-section page.
* **`r3f` chunk is 263 kB gzipped.** That is the cost of three + drei. It is lazy and
  preloaded during the (already blocking) preloader, so it is not on the render-blocking
  path — but it *is* on the time-to-interactive path. Dropping drei entirely saves
  roughly 60 kB gz and costs you `useProgress`.
* **`legacy-peer-deps`** is an npm workaround for R3F's optional Expo peers, not a
  dependency pin. Revisit it when R3F ships peer metadata that npm respects; until then
  do not remove `.npmrc`.
