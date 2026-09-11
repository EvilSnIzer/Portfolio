import { lazy, Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { MorphCore } from './MorphCore'
import { TimelineTube } from './TimelineTube'
import { ProjectPlanes } from './ProjectPlanes'
import { ContactAccent } from './ContactAccent'
import { SkillLinks } from './SkillLinks'
import { CameraRig } from './CameraRig'
import { SceneProgressReporter } from './SceneProgressReporter'

/**
 * The whole WebGL layer. Mounted lazily (see components/SceneShell.tsx) and kept
 * alive for the entire page, so the camera journey is one continuous path rather
 * than six separate canvases.
 */
const Effects = lazy(() => import('./EffectsBloom'))

export default function CanvasRoot({
  tier = 'high',
  particles = 6000,
  flyThrough = true,
  reduced = false,
  bloom = false,
  running = true,
  introKey = 0,
  onReady,
}: {
  tier?: string
  particles?: number
  flyThrough?: boolean
  reduced?: boolean
  bloom?: boolean
  running?: boolean
  introKey?: number
  onReady?: () => void
}) {
  const dpr = useMemo(
    () => (tier === 'high' ? [1, 1.75] : tier === 'medium' ? [1, 1.5] : [1, 1.3]),
    [tier]
  ) as [number, number]

  return (
    <Canvas
      // Pausing when the canvas is off-screen is the cheapest battery win here.
      frameloop={running ? 'always' : 'never'}
      dpr={dpr}
      gl={{
        alpha: true,
        // dpr ≥1.3 plus additive particles: MSAA would cost fill-rate and buy nothing.
        antialias: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      className="!absolute !inset-0 !h-full !w-full"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      camera={{ fov: tier === 'mobile' ? 56 : 42, near: 0.1, far: 120, position: [0, 0.2, 16] }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(new THREE.Color('#0a0a0a'), 0)
        scene.background = null
        gl.toneMapping = THREE.NoToneMapping
        gl.debug.checkShaderErrors = import.meta.env.DEV
      }}
    >
      {/* drei's useProgress is a react-dom hook: sibling of the Canvas, not inside it. */}
      <SceneProgressReporter />

      <Suspense fallback={null}>
        <CameraRig flyThrough={flyThrough} reduced={reduced} introKey={introKey} onReady={onReady} />
        <ParticleField count={particles} reduced={reduced} />
        <MorphCore reduced={reduced} />
        <TimelineTube />
        <SkillLinks />
        <ProjectPlanes tier={tier} />
        <ContactAccent reduced={reduced} />
        {bloom ? (
          <Suspense fallback={null}>
            <Effects />
          </Suspense>
        ) : null}
      </Suspense>
    </Canvas>
  )
}
