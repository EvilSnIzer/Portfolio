import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { scroll } from '../state/scroll'
import { tintAt } from '../lib/palette'
import { clamp01, damp, mulberry32 } from '../lib/damp'

/**
 * Light trails — the layer that answers *how fast*, not just *how far*.
 *
 * At rest this object is literally invisible (alpha is gated on scroll velocity),
 * so it costs nothing while you read. The instant you throw the page, every streak
 * extends along the direction of travel and burns in, then relaxes back out over a
 * few frames. Combined with the particle warp it turns "scroll" into "travel", and
 * on the `high` tier the existing bloom pass picks the trails up for free.
 *
 * Cost: one draw call, `count` line segments, and the entire animation lives in
 * the vertex shader as a single signed length uniform — the CPU writes one float
 * per frame. `gl.LINES` cannot carry a width, so trails stay 1px and read as light
 * rather than as geometry, which is the whole point.
 */
const vert = /* glsl */ `
uniform float uLen, uTime;
attribute float aSeed;
attribute float aEnd;
varying float vFade;
void main(){
  vec3 p = position;
  float reach = (0.55 + aSeed * 1.55);
  // Signed length: the tail grows behind the direction of travel and flips with it.
  p.y -= aEnd * uLen * reach;
  p.x += sin(uTime * 0.18 + aSeed * 6.283) * 0.45 * (1.0 - aEnd * 0.5);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  // Head bright, tail gone — a line that fades at both ends reads as a smear.
  vFade = 1.0 - aEnd * 0.78;
  gl_Position = projectionMatrix * mv;
}
`

const frag = /* glsl */ `
uniform float uOpacity;
uniform vec3  uColor;
uniform vec3  uTint;
void main(){
  float a = uOpacity * vFade;
  if (a < 0.003) discard;
  vec3 col = mix(uColor, uTint, 0.45);
  gl_FragColor = vec4(col * (0.7 + a * 0.6), a);
}
`

export function WarpStreaks({ count = 260, reduced = false }: { count?: number; reduced?: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const len = useRef(0)
  const tint = useRef(new THREE.Color('#f3a63b'))

  const geometry = useMemo(() => {
    const rnd = mulberry32(4242)
    // Two vertices per streak; the head is authored, the tail is shader math.
    const pos = new Float32Array(count * 2 * 3)
    const seed = new Float32Array(count * 2)
    const end = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2
      // Same cylindrical shell as the particle field so the trails sit *in* it.
      const r = 6 + Math.pow(rnd(), 0.7) * 20
      const x = Math.cos(a) * r * 1.3
      const z = Math.sin(a) * r * 0.8 - 1
      const y = (rnd() - 0.5) * 26 - 1.8
      const s = rnd()
      for (let k = 0; k < 2; k++) {
        const j = (i * 2 + k) * 3
        pos[j] = x
        pos[j + 1] = y
        pos[j + 2] = z
        seed[i * 2 + k] = s
        end[i * 2 + k] = k
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -1.8, -1), 48)
    return g
  }, [count])

  useLayoutEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uLen: { value: 0 },
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color('#f2f2f0') },
      uTint: { value: new THREE.Color('#f3a63b') },
    }),
    []
  )

  useFrame((state, delta) => {
    const u = matRef.current?.uniforms
    if (!u) return
    const dt = Math.min(delta, 1 / 24)
    u.uTime.value = state.clock.elapsedTime

    // Lenis velocity is −2.5…2.5 after the scroll tick's clamp; scale to world
    // units so a normal flick gives a short smear and a throw gives a long one.
    const target = reduced ? 0 : scroll.velocity * 2.9
    len.current += (target - len.current) * damp(9, dt)
    u.uLen.value = len.current

    // Gate visibility on |length| so an idle page never pays for this draw's alpha.
    const mag = clamp01(Math.abs(len.current) / 1.6)
    u.uOpacity.value += (mag * 0.5 - u.uOpacity.value) * damp(8, dt)

    const { a } = tintAt(scroll.progress)
    tint.current.setRGB(a[0] / 255, a[1] / 255, a[2] / 255)
    ;(u.uTint.value as THREE.Color).lerp(tint.current, 0.06)
  })

  if (reduced) return null

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vert}
        fragmentShader={frag}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  )
}
