import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { scroll } from '../state/scroll'
import { pointer } from '../state/pointer'

/**
 * 3D assets built from scratch — no bought models.
 * Low-poly sculptures that tell the story: Data cubes, Neural lattice, Code brackets.
 */
export function ScratchAssets({ tier = 'high' }: { tier?: string }) {
  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    const p = scroll.progress
    // Fade per section: stronger in About/Skills (0.15-0.45), dim elsewhere
    const inZone = p > 0.11 && p < 0.5 ? 1 : 0.22
    group.current.visible = tier !== 'mobile'
    group.current.rotation.y = p * 0.42 + pointer.sx * 0.08
    group.current.rotation.x = Math.sin(t * 0.12) * 0.04
    group.current.traverse((obj: any) => {
      if (obj.isMesh && obj.material?.emissive) obj.material.emissiveIntensity = 0.25 + Math.sin(t * 0.5 + obj.position.x) * 0.08
    })
  })

  return (
    <group ref={group} position={[0, -0.6, -4.8]}>
      {/* Data stack — three cubes */}
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
        <group position={[-2.6, 1.2, 0.2]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, i * 0.42, 0]} rotation={[0.2, 0.35, 0]}>
              <boxGeometry args={[0.55 - i * 0.06, 0.28, 0.38]} />
              <meshStandardMaterial color={i === 2 ? '#f3a63b' : '#e8e8e6'} transparent opacity={0.92} roughness={0.7} emissive={i === 2 ? '#b9761d' : '#000'} emissiveIntensity={i === 2 ? 0.3 : 0} />
            </mesh>
          ))}
          {/* floating label line */}
          <mesh position={[0, -0.36, 0]}><planeGeometry args={[1.1, 0.02]} /><meshBasicMaterial color="#f3a63b" transparent opacity={0.6} /></mesh>
        </group>
      </Float>

      {/* Neural lattice — octahedron lattice */}
      <Float speed={0.9} rotationIntensity={0.5} floatIntensity={0.7}>
        <group position={[2.7, 0.9, -0.6]}>
          <mesh>
            <octahedronGeometry args={[0.52, 0]} />
            <meshStandardMaterial color="#7c3aed" wireframe transparent opacity={0.42} emissive="#5b21b6" emissiveIntensity={0.35} />
          </mesh>
          <mesh scale={[0.62, 0.62, 0.62]}>
            <octahedronGeometry args={[0.52, 0]} />
            <meshStandardMaterial color="#a78bfa" transparent opacity={0.14} />
          </mesh>
          {/* orbiting dot */}
          <mesh position={[0.62, 0.2, 0.3]}><sphereGeometry args={[0.06, 12, 12]} /><meshStandardMaterial color="#f3a63b" emissive="#f3a63b" emissiveIntensity={0.8} /></mesh>
        </group>
      </Float>

      {/* Code brackets — sharp, no beads */}
      <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.5}>
        <group position={[1.9, -1.35, 0.8]} rotation={[0.3, -0.4, 0.1]}>
          <mesh position={[-0.16, 0, 0]}><boxGeometry args={[0.06, 0.48, 0.06]} /><meshStandardMaterial color="#f6f6f3" /></mesh>
          <mesh position={[0.16, 0, 0]}><boxGeometry args={[0.06, 0.48, 0.06]} /><meshStandardMaterial color="#f6f6f3" /></mesh>
          <mesh position={[0, 0.21, 0]}><boxGeometry args={[0.34, 0.06, 0.06]} /><meshStandardMaterial color="#f6f6f3" /></mesh>
          <mesh position={[0, -0.21, 0]}><boxGeometry args={[0.34, 0.06, 0.06]} /><meshStandardMaterial color="#f6f6f3" /></mesh>
          <mesh position={[0, 0, 0]}><planeGeometry args={[0.1, 0.24]} /><meshBasicMaterial color="#f3a63b" /></mesh>
        </group>
      </Float>

      {/* Wire grid floor accent */}
      <mesh position={[0, -1.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 8, 12, 8]} />
        <meshStandardMaterial color="#141414" wireframe transparent opacity={0.16} />
      </mesh>
    </group>
  )
}
