import { useEffect, useState } from 'react'
import { Nav } from './components/Nav'
import { Preloader } from './components/Preloader'
import { NoiseOverlay } from './components/NoiseOverlay'
import { ScrollBackdrop } from './components/ScrollBackdrop'
import { SceneShell } from './components/SceneShell'
import { Hero } from './sections/Hero'
import { About } from './sections/About'
import { Skills } from './sections/Skills'
import { Projects } from './sections/Projects'
import { Timeline } from './sections/Timeline'
import { Contact } from './sections/Contact'
import { GitHubActivity } from './components/GitHubActivity'
import { Testimonials } from './components/Testimonials'
import { CustomCursor } from './components/CustomCursor'
import { CommandPalette } from './components/CommandPalette'
import { EasterEgg } from './components/EasterEgg'
import { loadAssets } from './lib/assets'
import { useHandover } from './hooks/useLoadState'
import { useQuality } from './hooks/useMedia'
import { initScroll, teardownScroll } from './state/scroll'
import { bindPointer } from './state/pointer'

export default function App() {
  const q = useQuality()
  const { progress, ready, status, setSceneReady } = useHandover()
  const [revealed, setRevealed] = useState(false)
  const [scrollOn, setScrollOn] = useState(false)

  useEffect(() => {
    let dead = false
    loadAssets().then(()=>{ if(!dead) setRevealed(true) })
    const unbind = bindPointer()
    return () => { dead=true; unbind?.() }
  }, [])

  useEffect(() => {
    if (!ready) return
    let kill = () => {}
    initScroll({ smooth: !q.reduced }).then(()=>{ setScrollOn(true); kill = ()=>teardownScroll() })
    return () => kill()
  }, [ready, q.reduced])

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Preloader progress={progress} status={status} onDone={()=>{}} />
      <CustomCursor />
      <CommandPalette />
      <EasterEgg />
      <ScrollBackdrop />
      <SceneShell key={q.tier} introKey={revealed ? 1 : 0} onSceneReady={()=> setSceneReady(true)} />
      <NoiseOverlay reduced={q.reduced} />
      <Nav ready={revealed && scrollOn} />
      <main id="main">
        <Hero ready={revealed} />
        <About />
        <Skills />
        <Projects />
        <Timeline />
        <GitHubActivity />
        <Testimonials />
        <Contact ready={revealed} />
      </main>
    </>
  )
}
