import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { sceneState } from './sceneState'
import { pointer } from '../state/pointer'
import { smoothstep } from '../lib/damp'

/**
 * The single closing object: one small faceted knot, wireframe over a solid core,
 * that arrives as the contact section enters. It is the only place the accent
 * colour appears in solid form — that restraint is what keeps it expensive.
 */
export function ContactAccent({ reduced = false }: { reduced?: boolean }) {
  const wrap = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const wire = useRef<THREE.LineBasicMaterial>(null)
  const solid = useRef<THREE.MeshStandardMaterial>(null)
  const seen = useRef(0)

  const { geo, edges } = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.46, 1)
    return { geo: g, edges: new THREE.EdgesGeometry(g, 12) }
  }, [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 24)
    const want = sceneState.values.contact ?? 0
    seen.current += (want - seen.current) * (1 - Math.exp(-4 * dt))
    const k = seen.current
    if (wrap.current) {
      wrap.current.scale.setScalar(0.35 + k * 0.9)
      wrap.current.visible = k > 0.01
    }
    if (inner.current) {
      const t = state.clock.elapsedTime
      const spin = reduced ? 0.06 : 0.22
      inner.current.rotation.y = t * spin
      inner.current.rotation.x = Math.sin(t * 0.4) * (reduced ? 0.08 : 0.3)
      inner.current.position.y = Math.sin(t * 0.7) * 0.05
      // Cursor tilt: the only other place the pointer touches the 3D world.
      inner.current.rotation.z = pointer.sx * 0.16 * k
    }
    const glow = smoothstep(0.15, 0.95, k)
    if (wire.current) wire.current.opacity = 0.14 + glow * 0.5
    if (solid.current) solid.current.emissiveIntensity = 0.15 + glow * 1.5
  })

  return (
    <group ref={wrap} position={[2.35, -6.85, -0.2]} visible={false}>
      <group ref={inner}>
        <mesh>
          <primitive object={geo} attach="geometry" />
          <meshStandardMaterial
            ref={solid}
            color="#151514"
            roughness={0.32}
            metalness={0.7}
            emissive="#f3a63b"
            emissiveIntensity={0.15}
            flatShading
          />
        </mesh>
        <lineSegments>
          <primitive object={edges} attach="geometry" />
          <lineBasicMaterial ref={wire} color="#f3a63b" transparent opacity={0.14} depthWrite={false} />
        </lineSegments>
      </group>
    </group>
  )
}
