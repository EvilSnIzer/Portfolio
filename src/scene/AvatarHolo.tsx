import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { sceneState } from './sceneState'
import { scroll } from '../state/scroll'
import { pointer } from '../state/pointer'

/**
 * Holographic avatar — floats in hero, fades out by About.
 * Sharp, premium, not beaded: clean frame with subtle scanline + glow.
 * Uses real avatar image from /img/avatar.jpg with fallback gradient.
 */
export function AvatarHolo() {
  const group = useRef<THREE.Group>(null)
  const frameRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()
  const texture = useTexture('/img/avatar.jpg')

  const frameMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#f3a63b', transparent: true, opacity: 0.9 }), [])
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#f3a63b', transparent: true, opacity: 0.14, depthWrite: false }), [])

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = 4
  }, [texture])

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const p = scroll.progress
    // Visible only in hero (0–0.18), quick fade
    const heroFade = THREE.MathUtils.clamp(1 - p / 0.19, 0, 1)
    const smoothFade = heroFade * heroFade * (3 - 2 * heroFade) // smoothstep
    g.visible = smoothFade > 0.01
    if (!g.visible) return

    const t = state.clock.elapsedTime
    // Position: right side on desktop, centered on mobile — use viewport width
    const isMobile = viewport.width < 6
    const baseX = isMobile ? 0 : 3.8
    const baseY = isMobile ? 0.2 : 0.65
    const baseZ = -2.2

    // Float + subtle sway
    g.position.x = baseX + Math.sin(t * 0.32) * 0.08 + pointer.sx * 0.35
    g.position.y = baseY + Math.sin(t * 0.42) * 0.09 + pointer.sy * 0.18
    g.position.z = baseZ + Math.sin(t * 0.28) * 0.06

    // Gentle rotation follows pointer + breathe
    g.rotation.y = -0.22 + pointer.sx * 0.18 + Math.sin(t * 0.2) * 0.05
    g.rotation.x = 0.06 + pointer.sy * -0.08
    g.rotation.z = Math.sin(t * 0.18) * 0.02

    // Scale pulse
    const s = 1 + Math.sin(t * 0.5) * 0.012
    g.scale.set(s, s, 1)

    // Opacity tied to hero progress
    if (frameRef.current) (frameRef.current.material as THREE.MeshBasicMaterial).opacity = 0.9 * smoothFade
    if (glowRef.current) (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.14 * smoothFade
    // Main group opacity via traverse
    g.traverse((obj: any) => {
      if (obj.isMesh && obj.material && obj.material.opacity !== undefined && obj !== frameRef.current && obj !== glowRef.current) {
        obj.material.opacity = smoothFade
      }
    })
  })

  // Scanline shader for avatar plane (subtle holographic)
  const scanVert = `
    varying vec2 vUv;
    void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
  `
  const scanFrag = `
    uniform sampler2D uTex;
    uniform float uTime;
    uniform float uFade;
    varying vec2 vUv;
    void main(){
      vec4 tex = texture2D(uTex, vUv);
      // subtle scanline
      float scan = 0.04 * sin(vUv.y * 220.0 - uTime * 6.0);
      // edge vignette
      float vig = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x)
                * smoothstep(0.0, 0.22, vUv.y) * smoothstep(1.0, 0.78, vUv.y);
      vec3 col = tex.rgb + scan;
      // warm tint at bottom
      col = mix(col, vec3(0.95,0.66,0.23), 0.07 * (1.0 - vUv.y));
      float a = tex.a * uFade * (0.92 + vig * 0.08);
      gl_FragColor = vec4(col, a);
    }
  `
  const scanUniforms = useMemo(() => ({
    uTex: { value: texture },
    uTime: { value: 0 },
    uFade: { value: 1 },
  }), [texture])

  useFrame((state) => {
    scanUniforms.uTime.value = state.clock.elapsedTime
    scanUniforms.uFade.value = THREE.MathUtils.clamp(1 - scroll.progress / 0.19, 0, 1)
  })

  const w = 1.62, h = 2.02
  const frameW = 0.04

  return (
    <group ref={group} position={[3.8, 0.65, -2.2]}>
      {/* Back glow */}
      <mesh ref={glowRef} position={[0, 0, -0.08]} scale={[1.16, 1.12, 1]}>
        <planeGeometry args={[w, h]} />
        <primitive object={glowMat} attach="material" />
      </mesh>

      {/* Avatar image */}
      <mesh>
        <planeGeometry args={[w, h]} />
        <shaderMaterial uniforms={scanUniforms} vertexShader={scanVert} fragmentShader={scanFrag} transparent depthWrite={false} />
      </mesh>

      {/* Top accent line */}
      <mesh ref={frameRef} position={[0, h / 2 + frameW / 2, 0.02]}>
        <planeGeometry args={[w + frameW * 2, frameW]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Bottom label bar */}
      <group position={[0, -h / 2 - 0.18, 0.02]}>
        <mesh>
          <planeGeometry args={[w, 0.22]} />
          <meshBasicMaterial color="#0a0a0a" transparent opacity={0.92} />
        </mesh>
        {/* Label text via canvas texture */}
        <LabelTexture />
      </group>

      {/* Corner brackets — sharp, no beads */}
      <CornerBracket x={-w / 2} y={h / 2} />
      <CornerBracket x={w / 2} y={h / 2} flipX />
      <CornerBracket x={-w / 2} y={-h / 2} flipY />
      <CornerBracket x={w / 2} y={-h / 2} flipX flipY />
    </group>
  )
}

function CornerBracket({ x, y, flipX, flipY }: { x: number; y: number; flipX?: boolean; flipY?: boolean }) {
  const sx = flipX ? -1 : 1
  const sy = flipY ? -1 : 1
  return (
    <group position={[x, y, 0.04]}>
      <mesh position={[sx * 0.08, 0, 0]}><planeGeometry args={[0.18, 0.02]} /><meshBasicMaterial color="#f3a63b" transparent opacity={0.95} /></mesh>
      <mesh position={[0, sy * 0.08, 0]}><planeGeometry args={[0.02, 0.18]} /><meshBasicMaterial color="#f3a63b" transparent opacity={0.95} /></mesh>
    </group>
  )
}

function LabelTexture() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512; c.height = 64
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, 512, 64)
    ctx.fillStyle = '#f3a63b'
    ctx.font = '600 11px "Geist Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('MANAN SHARMA  •  AI / ML ENGINEER', 256, 22)
    ctx.fillStyle = 'rgba(246,246,243,0.55)'
    ctx.font = '500 8px "Geist Mono", monospace'
    ctx.fillText('AVAILABLE FOR ML / DATA ROLES  —  INDIA · REMOTE', 256, 42)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.minFilter = THREE.LinearFilter
    return t
  }, [])
  return (
    <mesh>
      <planeGeometry args={[1.52, 0.18]} />
      <meshBasicMaterial map={tex} transparent opacity={0.96} depthWrite={false} />
    </mesh>
  )
}
