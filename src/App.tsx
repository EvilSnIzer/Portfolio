import { useEffect, useState } from 'react'
import { Nav } from './components/Nav'
import { Preloader } from './components/Preloader'
import { NoiseOverlay } from './components/NoiseOverlay'
import { SceneShell } from './components/SceneShell'
import { Hero } from './sections/Hero'
import { About } from './sections/About'
import { Skills } from './sections/Skills'
import { Projects } from './sections/Projects'
import { Timeline } from './sections/Timeline'
import { Contact } from './sections/Contact'
import { loadAssets } from './lib/assets'
import { useHandover } from './hooks/useLoadState'
import { useQuality } from './hooks/useMedia'
import { initScroll, teardownScroll } from './state/scroll'
import { bindPointer } from './state/pointer'

/**
 * Composition root. Order of operations matters and is deliberate:
 *
 *   1. paint DOM immediately (preloader visible, content already in the DOM)
 *   2. kick off assets + lazy three chunk            → progress bar
 *   3. mount the WebGL layer behind everything        → camera rig starts
 *   4. init Lenis + ScrollTrigger once layout is final (fonts, pinned sections)
 *   5. hand over: preloader curtains up, hero type splits in
 */
export default function App() {
  const q = useQuality()
  const { progress, ready, status, setSceneReady } = useHandover()
  const [revealed, setRevealed] = useState(false)
  const [scrollOn, setScrollOn] = useState(false)

  useEffect(() => {
    let dead = false
    loadAssets().then(() => {
      if (!dead) setRevealed(true)
    })
    const unbind = bindPointer()
    return () => {
      dead = true
      unbind?.()
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    let kill = () => {}
    // Scroll machinery boots after reveal so ScrollTrigger measures a settled
    // layout; reduced-motion users get native scroll and no smoothing at all.
    initScroll({ smooth: !q.reduced }).then(() => {
      setScrollOn(true)
      kill = () => teardownScroll()
    })
    return () => kill()
  }, [ready, q.reduced])

  return (
    <>
      <Preloader progress={progress} status={status} onDone={() => {}} />

      <SceneShell key={q.tier} introKey={revealed ? 1 : 0} onSceneReady={() => setSceneReady(true)} />
      <NoiseOverlay reduced={q.reduced} />

      <Nav ready={revealed && scrollOn} />

      <main id="main">
        <Hero ready={revealed} />
        <About />
        <Skills />
        <Projects />
        <Timeline />
        <Contact ready={revealed} />
      </main>
    </>
  )
}
