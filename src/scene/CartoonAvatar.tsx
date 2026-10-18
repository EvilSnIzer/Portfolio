import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { scroll } from '../state/scroll'
import { pointer } from '../state/pointer'

/**
 * 3D Cartoon Avatar — built from scratch, no external model.
 * Head: toon-shaded sphere + hair cap + eyes that TRACK cursor.
 * Body: stylized hoodie block. Entire rig floats & looks at pointer.
 */
export function CartoonAvatar() {
  const rig = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const leftEye = useRef<THREE.Mesh>(null)
  const rightEye = useRef<THREE.Mesh>(null)
  const pupilL = useRef<THREE.Mesh>(null)
  const pupilR = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()
  const texture = useTexture('/img/avatar-cartoon.png')

  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e8c5a8', roughness: 0.65, metalness: 0 }), [])
  const hairMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1a1e', roughness: 0.85 }), [])
  const hoodieMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0f0f10', roughness: 0.9 }), [])
  const hoodInnerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f3a63b', roughness: 0.7 }), [])
  const whiteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 }), [])
  const pupilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0a0a0a' }), [])

  useFrame((state) => {
    const g = rig.current
    if (!g) return
    const p = scroll.progress
    const fade = THREE.MathUtils.clamp(1 - p / 0.22, 0, 1)
    const smooth = fade * fade * (3 - 2 * fade)
    g.visible = smooth > 0.02
    if (!g.visible) return
    const t = state.clock.elapsedTime

    const isMobile = viewport.width < 6
    g.position.x = (isMobile ? 0 : 3.9) + Math.sin(t * 0.3) * 0.05 + pointer.sx * 0.18
    g.position.y = (isMobile ? 0.1 : 0.55) + Math.sin(t * 0.38) * 0.07 + pointer.sy * 0.1
    g.position.z = -2.4 + Math.sin(t * 0.25) * 0.04
    g.scale.setScalar(1.35 * (isMobile ? 0.7 : 1))
    g.rotation.y = -0.28 + pointer.sx * 0.55
    g.rotation.x = 0.04 + pointer.sy * -0.12

    // Head look-at tracking
    if (head.current) {
      head.current.rotation.y = pointer.sx * 0.7
      head.current.rotation.x = pointer.sy * -0.35
      head.current.position.y = Math.sin(t * 0.4) * 0.03
    }

    // Eye tracking — pupils follow cursor
    const eyeX = THREE.MathUtils.clamp(pointer.sx * 0.06, -0.08, 0.08)
    const eyeY = THREE.MathUtils.clamp(pointer.sy * -0.04, -0.05, 0.05)
    if (pupilL.current) { pupilL.current.position.x = eyeX; pupilL.current.position.y = eyeY }
    if (pupilR.current) { pupilR.current.position.x = eyeX; pupilR.current.position.y = eyeY }

    // Blink every ~3s
    const blink = Math.sin(t * 0.9) > 0.985 ? 0.08 : 1
    if (leftEye.current) leftEye.current.scale.y = blink
    if (rightEye.current) rightEye.current.scale.y = blink

    // Opacity fade
    g.traverse((obj: any) => {
      if (obj.isMesh && obj.material?.opacity !== undefined) obj.material.opacity = smooth
    })
  })

  return (
    <group ref={rig} position={[3.9, 0.55, -2.4]}>
      {/* Shadow glow */}
      <mesh position={[0, -1.18, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.85, 32]} />
        <meshBasicMaterial color="#f3a63b" transparent opacity={0.12} depthWrite={false} />
      </mesh>

      {/* Body — hoodie block with inner accent */}
      <group position={[0, -0.68, 0]}>
        {/* torso */}
        <mesh>
          <boxGeometry args={[0.95, 0.78, 0.55]} />
          <primitive object={hoodieMat} attach="material" />
        </mesh>
        {/* hood inner */}
        <mesh position={[0, 0.34, -0.12]} rotation={[0.12, 0, 0]}>
          <torusGeometry args={[0.42, 0.09, 12, 24, Math.PI * 1.25]} />
          <primitive object={hoodInnerMat} attach="material" />
        </mesh>
        {/* zip line */}
        <mesh position={[0, 0, 0.28]}>
          <planeGeometry args={[0.02, 0.72]} />
          <meshBasicMaterial color="#f3a63b" />
        </mesh>
        {/* chest logo — MS */}
        <group position={[0.18, 0.06, 0.29]}>
          <mesh><planeGeometry args={[0.24, 0.14]} /><meshBasicMaterial color="#f6f6f3" transparent opacity={0.92} /></mesh>
        </group>
        {/* arms */}
        <mesh position={[-0.62, -0.08, 0]} rotation={[0, 0, 0.08]}>
          <capsuleGeometry args={[0.16, 0.52, 8, 16]} />
          <primitive object={hoodieMat} attach="material" />
        </mesh>
        <mesh position={[0.62, -0.08, 0]} rotation={[0, 0, -0.08]}>
          <capsuleGeometry args={[0.16, 0.52, 8, 16]} />
          <primitive object={hoodieMat} attach="material" />
        </mesh>
      </group>

      {/* Head rig */}
      <group ref={head} position={[0, 0.42, 0]}>
        {/* Head base */}
        <mesh>
          <sphereGeometry args={[0.52, 32, 32]} />
          <primitive object={skinMat} attach="material" />
        </mesh>
        {/* Hair cap */}
        <mesh position={[0, 0.18, -0.06]} scale={[1.04, 0.72, 1.02]}>
          <sphereGeometry args={[0.52, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <primitive object={hairMat} attach="material" />
        </mesh>
        {/* Hair fringe */}
        <mesh position={[0, 0.08, 0.36]} rotation={[0.22, 0, 0]}>
          <cylinderGeometry args={[0.48, 0.52, 0.18, 16]} />
          <primitive object={hairMat} attach="material" />
        </mesh>

        {/* Eyes — white sclera */}
        <mesh ref={leftEye} position={[-0.17, 0.02, 0.44]}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <primitive object={whiteMat} attach="material" />
        </mesh>
        <mesh ref={rightEye} position={[0.17, 0.02, 0.44]}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <primitive object={whiteMat} attach="material" />
        </mesh>
        {/* Pupils — track pointer */}
        <mesh ref={pupilL} position={[-0.17, 0.02, 0.52]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <primitive object={pupilMat} attach="material" />
        </mesh>
        <mesh ref={pupilR} position={[0.17, 0.02, 0.52]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <primitive object={pupilMat} attach="material" />
        </mesh>
        {/* Eye highlights */}
        <mesh position={[-0.14, 0.05, 0.54]}><sphereGeometry args={[0.018, 8, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[0.2, 0.05, 0.54]}><sphereGeometry args={[0.018, 8, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>

        {/* Nose — subtle */}
        <mesh position={[0, -0.1, 0.48]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <primitive object={skinMat} attach="material" />
        </mesh>
        {/* Mouth — smile */}
        <mesh position={[0, -0.22, 0.46]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.08, 0.015, 8, 16, Math.PI]} />
          <meshBasicMaterial color="#b76e6e" />
        </mesh>

        {/* Glasses — premium detail */}
        <group position={[0, 0.02, 0.42]}>
          <mesh position={[-0.17, 0, 0.04]}><torusGeometry args={[0.12, 0.012, 8, 16]} /><meshBasicMaterial color="#0a0a0a" transparent opacity={0.9} /></mesh>
          <mesh position={[0.17, 0, 0.04]}><torusGeometry args={[0.12, 0.012, 8, 16]} /><meshBasicMaterial color="#0a0a0a" transparent opacity={0.9} /></mesh>
          <mesh position={[0, 0, 0.04]}><boxGeometry args={[0.08, 0.012, 0.012]} /><meshBasicMaterial color="#0a0a0a" /></mesh>
        </group>
      </group>

      {/* Floating accent — tiny 3D code bracket orbiting head */}
      <group position={[0.75, 0.35, 0.2]} rotation={[0.2, 0.4, 0]}>
        <mesh><boxGeometry args={[0.12, 0.12, 0.04]} /><meshStandardMaterial color="#f3a63b" emissive="#b9761d" emissiveIntensity={0.35} /></mesh>
      </group>
      <group position={[-0.72, 0.05, 0.18]} rotation={[0.1, -0.3, 0.15]}>
        <mesh><octahedronGeometry args={[0.09]} /><meshStandardMaterial color="#7c3aed" emissive="#5b21b6" emissiveIntensity={0.3} /></mesh>
      </group>
    </group>
  )
}

function useRigTexture() {}
