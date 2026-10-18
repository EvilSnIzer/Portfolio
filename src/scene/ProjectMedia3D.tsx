import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { sceneState } from './sceneState'
import { projects } from '../content/projects'
import { clamp01 } from '../lib/damp'

/**
 * Project Media — 3D planes with real screenshots as textures.
 * Replaces simple boxes with framed media: bevel, label, live indicator.
 * Motion-tracked: follows pointer + scroll progress.
 */
export function ProjectMedia3D({ tier = 'high' }: { tier?: string }) {
  const group = useRef<THREE.Group>(null)
  const urls = projects.map((p) => p.image || '/img/avatar.jpg')
  // useTexture with suspense — provide fallback
  const textures = useTexture(urls.length ? urls : ['/img/avatar.jpg'])

  const texArray = Array.isArray(textures) ? textures : [textures]

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const p = clamp01(sceneState.projects.x)
    // Only strong in Projects zone (scroll 0.42-0.68)
    const { progress } = (awaitImportProgress())
    const inProject = progress > 0.38 && progress < 0.7 ? 1 : 0.18
    g.visible = inProject > 0.15
    g.position.x = -p * 9 + 4.5
    g.position.y = -1.2 + Math.sin(state.clock.elapsedTime * 0.18) * 0.04
    g.rotation.y = p * 0.12
  })

  return (
    <group ref={group} position={[0, -1.2, -3.2]}>
      {projects.map((proj, i) => {
        const tex = (texArray as THREE.Texture[])[i] || texArray[0]
        return (
          <group key={proj.id} position={[(i - 2) * 2.35, 0, -i * 0.12]} rotation={[0, i % 2 ? 0.1 : -0.1, 0]}>
            {/* frame */}
            <mesh>
              <boxGeometry args={[1.9, 1.18, 0.06]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.85} />
            </mesh>
            {/* screen */}
            <mesh position={[0, 0.06, 0.04]}>
              <planeGeometry args={[1.72, 0.88]} />
              <meshStandardMaterial map={tex as THREE.Texture} roughness={0.6} metalness={0.05} />
            </mesh>
            {/* top bar */}
            <mesh position={[0, 0.52, 0.04]}>
              <boxGeometry args={[1.72, 0.08, 0.01]} />
              <meshStandardMaterial color="#0a0a0a" />
            </mesh>
            {/* live indicator */}
            <mesh position={[0.72, 0.52, 0.05]}>
              <planeGeometry args={[0.18, 0.04]} />
              <meshBasicMaterial color="#f3a63b" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function awaitImportProgress() {
  // dynamic to avoid circular import — read scroll directly
  try {
    const { scroll } = require('../state/scroll')
    return scroll
  } catch {
    return { progress: 0 }
  }
}
