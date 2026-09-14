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
  const meshes = useRef<THREE.Mesh[]>([])
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

  useFrame((state) => {
    const s = sceneState.projects
    const n = count
    const p = clamp01(s.x)
    const x = lerp(-SPAN / 2, SPAN / 2, p)
    if (group.current) {
      group.current.position.x = -x
      // A slow breath so the layer is never dead still when the rail is.
      group.current.position.y = Y + Math.sin(state.clock.elapsedTime * 0.16) * 0.05
    }
    // The focused plate is the one the DOM is centring. Because plate i is placed
    // at SPAN·(i/(n−1) − 0.5) and the group travels by lerp(−SPAN/2, SPAN/2, p),
    // the sum is exactly 0 at p = i/(n−1) — so "which plate is centred" and "which
    // card is in focus" are the same number, and one float keeps both layers honest.
    const focus = n > 1 ? p * (n - 1) : 0
    mats.current.forEach((m, i) => {
      if (!m) return
      const near = Math.max(0, 1 - Math.abs(i - focus))
      const hovered = s.hovered === i
      const want = hovered ? 0.98 : 0.16 + near * 0.66
      m.opacity += (want - m.opacity) * 0.12
      m.color.lerp(hovered || near > 0.7 ? tint.on : tint.off, 0.1)
      const mesh = meshes.current[i]
      if (mesh) {
        const k = 1 + near * 0.08
        mesh.scale.x += (k - mesh.scale.x) * 0.12
        mesh.scale.y = mesh.scale.x
      }
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
            ref={(el) => {
              if (el) meshes.current[i] = el
            }}
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
