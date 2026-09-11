import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { sceneState } from './sceneState'
import { projects } from '../content/projects'
import { clamp01, lerp } from '../lib/damp'

/**
 * Tilted plates that sit *behind* the pinned DOM project cards and slide with the
 * same horizontal progress the DOM uses. Same number, same source (ScrollTrigger),
 * so WebGL and the DOM can never drift apart.
 *
 * Textures: `THREE.TextureLoader` with a graceful onError → the plate falls back
 * to a procedural gradient so a missing screenshot never breaks the scene.
 */
const SPAN = 14
const Y = -1.55
const Z = -3.1

function fallbackTexture(index: number) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 256, 256)
  g.addColorStop(0, '#161616')
  g.addColorStop(1, index % 2 ? '#1d1a15' : '#121212')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  ctx.strokeStyle = 'rgba(243,166,59,0.35)'
  ctx.lineWidth = 1.5
  for (let i = 0; i < 9; i++) {
    ctx.beginPath()
    ctx.moveTo(0, i * 30 + 12)
    ctx.lineTo(256, i * 30 + 12 + (i % 2 ? 16 : -16))
    ctx.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function ProjectPlanes({ tier = 'high' }: { tier?: string }) {
  const count = projects.length
  const group = useRef<THREE.Group>(null)
  const mats = useRef<THREE.MeshBasicMaterial[]>([])
  const textures = useMemo(
    () =>
      projects.map((p) => {
        const loader = new THREE.TextureLoader()
        loader.setCrossOrigin('anonymous')
        const tex = loader.load(
          p.image || '',
          (t) => {
            t.colorSpace = THREE.SRGBColorSpace
            t.anisotropy = tier === 'high' ? 4 : 0
            t.generateMipmaps = true
            t.minFilter = THREE.LinearMipmapLinearFilter
          },
          undefined,
          () => {
            // Missing file: swap in the plate, keep going.
            const fb = fallbackTexture(projects.indexOf(p))
            tex.image = fb.image
            tex.needsUpdate = true
          }
        )
        return tex
      }),
    [tier]
  )

  const tint = useMemo(
    () => ({ on: new THREE.Color('#ffffff'), off: new THREE.Color('#b9b9b5') }),
    []
  )

  useFrame(() => {
    const s = sceneState.projects
    const x = lerp(-SPAN / 2, SPAN / 2, clamp01(s.x))
    if (group.current) group.current.position.x = -x
    mats.current.forEach((m, i) => {
      if (!m) return
      const hovered = s.hovered === i
      m.opacity += ((hovered ? 0.95 : 0.55) - m.opacity) * 0.12
      m.color.lerp(hovered ? tint.on : tint.off, 0.12)
    })
  })

  return (
    <group ref={group} position={[0, Y, Z]}>
      {projects.map((p, i) => {
        const w = 3.1
        const h = 1.94
        // Evenly spread across SPAN; the DOM gallery pitch is derived from the
        // same constant (see sections/Projects.tsx) so they stay in lockstep.
        const px = (count === 1 ? 0 : i / (count - 1) - 0.5) * SPAN
        return (
          <mesh
            key={p.id}
            position={[px, 0, -i * 0.14]}
            rotation={[-0.06, i % 2 ? 0.3 : -0.3, i % 2 ? -0.045 : 0.045]}
          >
            <planeGeometry args={[w, h, 1, 1]} />
            <meshBasicMaterial
              ref={(el) => {
                if (el) mats.current[i] = el
              }}
              map={textures[i]}
              transparent
              opacity={0.55}
              color="#b9b9b5"
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}
