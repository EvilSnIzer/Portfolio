/**
 * Film grain. Deliberately DOM/CSS rather than a post-processing pass: it costs
 * one composited layer with no shader, works identically whether WebGL loaded or
 * not, and covers the *whole viewport* including text — which is what makes the
 * render feel like film instead of a WebGL demo.
 *
 * Technique: an inline SVG feTurbulence tile, upscaled ~2.2× so the grain is
 * visible rather than shimmering, with a cheap transform-based jitter (GPU only,
 * no repaint) that steps in 8 discrete frames so it reads as film, not as noise TV.
 */
const GRAIN_SVG = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
<rect width="200" height="200" filter="url(#n)" opacity="0.55"/></svg>`)

export const grainUrl = `url("data:image/svg+xml,${GRAIN_SVG}")`

export function NoiseOverlay({ reduced = false }: { reduced?: boolean }) {
  return (
    <>
      <div
        aria-hidden="true"
        className="grain pointer-events-none fixed inset-[-60%] z-50 opacity-[0.19] mix-blend-soft-light"
        style={{ backgroundImage: grainUrl, backgroundSize: '200px 200px', willChange: 'transform' }}
        data-static={reduced ? '1' : undefined}
      />
      {/* Static vignette: replaces an ambient-occlusion pass for free. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 45%, rgba(10,10,10,0) 38%, rgba(10,10,10,0.42) 78%, rgba(10,10,10,0.72) 100%)',
        }}
      />
      <style>{`
        .grain { animation: grain 900ms steps(1,end) infinite; }
        .grain[data-static] { animation: none; opacity: .12; }
        @keyframes grain {
          0%   { transform: translate3d(0,0,0); }
          12.5%{ transform: translate3d(-2%, 3%,0); }
          25%  { transform: translate3d(3%, -2%,0); }
          37.5%{ transform: translate3d(-3%, -4%,0); }
          50%  { transform: translate3d(2%, 3%,0); }
          62.5%{ transform: translate3d(-1%, 1%,0); }
          75%  { transform: translate3d(4%, -1%,0); }
          87.5%{ transform: translate3d(-2%, 2%,0); }
        }
      `}</style>
    </>
  )
}
