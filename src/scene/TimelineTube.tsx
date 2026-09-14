import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { sceneState } from './sceneState'
import { smoothstep } from '../lib/damp'
import { timeline } from '../content/timeline'

/**
 * Timeline geometry: a CatmullRom tube that draws itself in as you scroll, with
 * one emissive marker per milestone that lights up as its date passes.
 *
 * Marker activation is derived from the single `scroll.section.timeline` value
 * written by the scroll engine — deliberately NOT one ScrollTrigger per marker.
 * Fewer triggers, and the lighting can never desync from the tube draw.
 */
const FROM = new THREE.Vector3(-0.4, -2.15, -1.4)
const TO = new THREE.Vector3(1.15, -5.55, -1.0)

function buildCurve() {
  const pts: THREE.Vector3[] = []
  const steps = 9
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = THREE.MathUtils.lerp(FROM.y, TO.y, t)
    // Gentle S through x/z so it reads as a trajectory, not a straight rail.
    const x = THREE.MathUtils.lerp(FROM.x, TO.x, t) + Math.sin(t * Math.PI * 1.9) * 1.55
    const z = THREE.MathUtils.lerp(FROM.z, TO.z, t) + Math.cos(t * Math.PI * 1.35) * 0.85
    pts.push(new THREE.Vector3(x, y, z))
  }
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4)
}

const tubeVert = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const tubeFrag = /* glsl */ `
uniform float uProgress, uOpacity, uTime;
uniform vec3 uBase;
uniform vec3 uAccent;
varying vec2 vUv;
void main(){
  float x = vUv.y;                       // tube is built along its length
  float lit = smoothstep(x - 0.02, x + 0.005, uProgress);
  // A short comet head so the "draw" has a leading edge, not a hard cut.
  float head = smoothstep(0.0, 1.0, 1.0 - abs(x - uProgress) * 26.0);
  vec3 col = mix(uBase, uAccent, head * 0.9);
  float pulse = 0.85 + 0.15 * sin(uTime * 1.6 - x * 34.0);
  float a = (0.055 + lit * 0.62 + head * 0.55) * uOpacity * pulse;
  if (a < 0.004) discard;
  gl_FragColor = vec4(col * (0.35 + lit * 1.1 + head * 1.4), a);
}
`

export function TimelineTube() {
  const curve = useMemo(buildCurve, [])
  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, 160, 0.018, 6, false),
    [curve]
  )
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const rings = useRef<THREE.Group>(null)
  const groups = useRef<THREE.Mesh[]>([])
  const cores = useRef<THREE.Mesh[]>([])
  const lit = useRef<number[]>(timeline.map(() => 0))

  const markers = useMemo(() => {
    // Space markers by real chronology, not array index.
    const times = timeline.map((m) => {
      const [y, mo] = m.date.split('-').map(Number)
      return y + ((mo || 1) - 1) / 12
    })
    const min = Math.min(...times)
    const max = Math.max(...times)
    return timeline.map((m, i) => {
      const t = max === min ? 0.5 : (times[i] - min) / (max - min)
      const pos = curve.getPointAt(THREE.MathUtils.clamp(t, 0.02, 0.98))
      return { ...m, t, pos }
    })
  }, [curve])

  useLayoutEffect(
    () => () => {
      geometry.dispose()
    },
    [geometry]
  )

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uBase: { value: new THREE.Color('#5a5a56') },
      uAccent: { value: new THREE.Color('#f3a63b') },
    }),
    []
  )

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 24)
    const p = sceneState.values.tube ?? 0
    if (matRef.current) {
      const u = matRef.current.uniforms
      u.uTime.value = state.clock.elapsedTime
      u.uProgress.value += (p - u.uProgress.value) * (1 - Math.exp(-6 * dt))
      // Fade the tube as the hero/core fade back in, so it never competes.
      u.uOpacity.value += (1 - (sceneState.values.fieldFade ?? 1) * 0.35 - u.uOpacity.value) *
        (1 - Math.exp(-5 * dt))
    }
    const prog = matRef.current?.uniforms.uProgress.value ?? 0

    // Rings share one quaternion from the camera → billboarded, zero per-object math.
    if (rings.current) rings.current.quaternion.copy(state.camera.quaternion)

    markers.forEach((mk, i) => {
      const on = smoothstep(mk.t - 0.1, mk.t + 0.06, prog)
      lit.current[i] += (on - lit.current[i]) * (1 - Math.exp(-7 * dt))
      const L = lit.current[i]
      const g = groups.current[i]
      const c = cores.current[i]
      if (g) {
        g.scale.setScalar(1 + L * 0.8)
        g.visible = L > 0.012
      }
      if (c) {
        const m = c.material as THREE.MeshBasicMaterial
        m.opacity = 0.14 + L * 0.86
        c.scale.setScalar(1 + L * 1.4)
      }
    })
  })

  return (
    <group>
      <mesh geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          vertexShader={tubeVert}
          fragmentShader={tubeFrag}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      <group ref={rings}>
        {markers.map((mk, i) => (
          <group key={`${mk.year}-${i}`} position={mk.pos}>
            <mesh
              ref={(el) => {
                if (el) groups.current[i] = el
              }}
            >
              <ringGeometry args={[0.072, 0.086, 40]} />
              <meshBasicMaterial
                color="#f3a63b"
                transparent
                opacity={0}
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            <mesh
              ref={(el) => {
                if (el) cores.current[i] = el
              }}
            >
              <sphereGeometry args={[0.026, 12, 12]} />
              <meshBasicMaterial color="#f2f2f0" transparent opacity={0.14} depthWrite={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}
