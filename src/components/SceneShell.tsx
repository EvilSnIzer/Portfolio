import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { getQuality } from '../state/quality'
import { sceneState } from '../scene/sceneState'

const CanvasRoot = lazy(() => import('../scene/CanvasRoot'))

/** WebGL2/JS availability probe — the page must read perfectly without it. */
function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

/**
 * Fixed, decorative WebGL layer sitting behind all content.
 *
 * • `aria-hidden` + `pointer-events:none` — screen readers and hit-testing never
 *   touch it, which is why every word on this page is real DOM text.
 * • The canvas is only imported after the preloader starts its fetch work, so the
 *   three chunk never blocks first paint.
 * • `frameloop` is switched to `never` while the (rare) case of a fully
 *   scrolled-past viewport happens, and paused entirely when the tab hides.
 */
export function SceneShell({ introKey = 0, onSceneReady }: { introKey?: number; onSceneReady?: () => void }) {
  const [enabled] = useState(() => !getQuality().no3d && hasWebGL())
  const [running, setRunning] = useState(true)
  const [visible, setVisible] = useState(true)
  const sentinel = useRef<HTMLDivElement>(null)
  const q = getQuality()

  useEffect(() => {
    sceneState.reduced = q.reduced
  }, [q.reduced])

  useEffect(() => {
    const onVis = () => setRunning(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    const el = sentinel.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  if (!enabled) return null

  return (
    <>
      <div ref={sentinel} className="pointer-events-none fixed inset-0 h-full w-full" aria-hidden />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-[100dvh] w-full [&>div]:!h-full [&>div]:!w-full"
        style={{ contain: 'paint' }}
      >
        <Suspense fallback={null}>
          <CanvasRoot
            tier={q.tier}
            particles={q.particles}
            flyThrough={q.flyThrough}
            reduced={q.reduced}
            bloom={q.bloom}
            running={running && visible}
            introKey={introKey}
            onReady={onSceneReady}
          />
        </Suspense>
      </div>
    </>
  )
}
