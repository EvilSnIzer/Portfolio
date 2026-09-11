import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { NOISE, makeGlowCanvas } from './glsl'
import { sceneState } from './sceneState'
import { pointer } from '../state/pointer'
import { mulberry32, clamp01 } from '../lib/damp'

/**
 * Ambient particle field — the atmosphere the camera flies through.
 *
 * Perf (this is the largest fill-rate item on the page):
 *  • one draw call; all motion — drift, cursor repulsion, size — is computed in
 *    the vertex shader, so the CPU writes three uniforms per frame and nothing else
 *  • additive blending with depthWrite:false removes sorting entirely
 *  • the sprite is a 64px canvas painted at runtime: no texture request, no
 *    alpha banding, crisp at any dpr
 */
const vert = /* glsl */ `
uniform float uTime, uEnergy, uPixelRatio, uScale, uMotion;
uniform vec2  uPointer;
attribute float aSeed;
attribute float aSize;
varying float vGlow;
varying float vMix;
${NOISE}
void main(){
  vec3 p = position;
  float t = uTime * (0.085 + uEnergy * 0.05);

  // Three decorrelated noise fields → slow, non-repeating drift.
  vec3 q = p * 0.055 + vec3(0.0, 0.0, aSeed * 12.0);
  p += vec3(
    snoise(vec3(q.x + t, q.y, aSeed * 9.1)),
    snoise(vec3(q.y - t * 0.8, q.z, aSeed * 4.7 + 3.3)),
    snoise(vec3(q.z + t * 0.6, q.x, aSeed * 6.3 + 7.7))
  ) * 1.35 * uMotion;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;

  // Cursor repulsion in NDC: cheap, and it reads as a force rather than a mesh
  // deformation because it only touches ~a tenth of the field at a time.
  vec2 ndc = clip.xy / max(1e-4, clip.w);
  float d = distance(ndc, uPointer);
  float infl = smoothstep(0.34, 0.0, d) * uEnergy;
  vec2 dir = normalize(ndc - uPointer + vec2(1e-5));
  clip.xy += dir * infl * 0.16 * clip.w;

  vGlow = infl;
  vMix  = aSeed;
  gl_PointSize = aSize * (uScale / max(0.4, -mv.z)) * uPixelRatio * (1.0 + infl * 1.8);
  gl_Position = clip;
}
`

const frag = /* glsl */ `
uniform float uOpacity;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform sampler2D uTexture;
varying float vGlow;
varying float vMix;
void main(){
  float a = texture2D(uTexture, gl_PointCoord).a;
  float alpha = a * uOpacity * (0.22 + vMix * 0.55);
  if (alpha < 0.004) discard;
  vec3 col = mix(uColorA, uColorB, smoothstep(0.74, 1.0, vMix) * 0.6 + vGlow * 0.85);
  gl_FragColor = vec4(col * (0.55 + vGlow * 1.1), alpha);
}
`

export function ParticleField({
  count = 6000,
  radius = 26,
  reduced = false,
}: {
  count?: number
  radius?: number
  reduced?: boolean
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const energy = useRef(0)

  const glow = useMemo(() => {
    const tex = new THREE.CanvasTexture(makeGlowCanvas(64))
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearFilter
    tex.generateMipmaps = false
    return tex
  }, [])

  const geometry = useMemo(() => {
    const rnd = mulberry32(1337)
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    const size = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2
      const r = Math.pow(rnd(), 0.62) * radius
      pos[i * 3] = Math.cos(a) * r * 1.4
      pos[i * 3 + 1] = (rnd() - 0.5) * radius * 0.9 - 1.8
      pos[i * 3 + 2] = Math.sin(a) * r * 0.8 - 1.0
      seed[i] = rnd()
      size[i] = 0.45 + Math.pow(rnd(), 2.7) * 2.7
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    // Manual bounds: this points cloud is never culled, but a bad sphere would
    // make THREE throw during raycast setup.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -1.8, -1), radius * 2.2)
    return g
  }, [count, radius])

  useLayoutEffect(
    () => () => {
      geometry.dispose()
    },
    [geometry]
  )
  useLayoutEffect(() => () => glow.dispose(), [glow])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
      uEnergy: { value: 0 },
      uOpacity: { value: 1 },
      uMotion: { value: reduced ? 0.22 : 1 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.75) },
      uScale: { value: 62 },
      uColorA: { value: new THREE.Color('#f2f2f0') },
      uColorB: { value: new THREE.Color('#f3a63b') },
      uTexture: { value: glow },
    }),
    [glow, reduced]
  )

  useFrame((state) => {
    const u = matRef.current?.uniforms
    if (!u) return
    u.uTime.value = state.clock.elapsedTime
    u.uPointer.value.set(pointer.sx, pointer.sy)
    const want = reduced ? 0.12 : pointer.active ? 1 : 0.22
    energy.current += (want - energy.current) * 0.05
    u.uEnergy.value = energy.current
    u.uOpacity.value += (sceneState.values.fieldFade - u.uOpacity.value) * 0.07
    // Publish idle energy for the other objects (bloom gate, tag springs).
    sceneState.pointerEnergy = energy.current
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial ref={matRef} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} />
    </points>
  )
}
