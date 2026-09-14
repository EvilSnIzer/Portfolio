import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { NOISE, makeGlowCanvas } from './glsl'
import { sceneState } from './sceneState'
import { pointer } from '../state/pointer'
import { scroll } from '../state/scroll'
import { tintAt } from '../lib/palette'
import { damp, mulberry32, clamp01 } from '../lib/damp'

/**
 * Ambient particle field — the atmosphere the camera flies through.
 *
 * Two things happen here and only one of them is the camera:
 *
 *  • *Warp.* `uVel` is the damped scroll velocity, and every particle is dragged
 *    against the direction of travel by an amount proportional to its own seed, so
 *    the field has depth-parallax inertia: scroll hard and the near layers shear
 *    further than the far ones. That is what makes the background read as a volume
 *    with mass instead of a fixed wallpaper with a camera bolted to it.
 *  • *Tint.* `uTint` is interpolated from the shared section palette, so the field
 *    warms and cools as you descend, in the same colours the CSS backdrop uses.
 *
 * Perf (this is still the largest fill-rate item on the page):
 *  • one draw call; all motion — drift, cursor repulsion, warp, size — is computed
 *    in the vertex shader, so the CPU writes four uniforms per frame and nothing else
 *  • additive blending with depthWrite:false removes sorting entirely
 *  • the sprite is a 64px canvas painted at runtime: no texture request, no alpha
 *    banding, crisp at any dpr
 */
const vert = /* glsl */ `
uniform float uTime, uEnergy, uPixelRatio, uScale, uMotion, uWarp;
uniform vec2  uPointer;
attribute float aSeed;
attribute float aSize;
varying float vGlow;
varying float vMix;
varying float vSpeed;
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

  // Scroll warp, in world space so it survives the camera rig. Each particle gets
  // its own bite of the shear (aSeed) — a uniform shift would read as a slide.
  float layer = 0.5 + aSeed * 0.85;
  p.y += uWarp * 2.55 * layer;
  p.x += uWarp * 0.55 * (aSeed - 0.5) * 2.2;
  float speed = min(1.0, abs(uWarp) * 0.62);

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
  vSpeed = speed;
  gl_PointSize = aSize * (uScale / max(0.4, -mv.z)) * uPixelRatio * (1.0 + infl * 1.8 + speed * 0.5);
  gl_Position = clip;
}
`

const frag = /* glsl */ `
uniform float uOpacity;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform vec3  uTint;
uniform sampler2D uTexture;
varying float vGlow;
varying float vMix;
varying float vSpeed;
void main(){
  float a = texture2D(uTexture, gl_PointCoord).a;
  float alpha = a * uOpacity * (0.22 + vMix * 0.55) * (1.0 + vSpeed * 0.45);
  if (alpha < 0.004) discard;
  vec3 col = mix(uColorA, uColorB, smoothstep(0.74, 1.0, vMix) * 0.6 + vGlow * 0.85);
  // Section palette, mixed in gently enough that the field still reads as light.
  col = mix(col, uTint, 0.20 + vGlow * 0.18 + vSpeed * 0.12);
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
  const warp = useRef(0)
  const tint = useRef(new THREE.Color('#f3a63b'))

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
      uWarp: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.75) },
      uScale: { value: 62 },
      uColorA: { value: new THREE.Color('#f2f2f0') },
      uColorB: { value: new THREE.Color('#f3a63b') },
      uTint: { value: new THREE.Color('#f3a63b') },
      uTexture: { value: glow },
    }),
    [glow, reduced]
  )

  useFrame((state, delta) => {
    const u = matRef.current?.uniforms
    if (!u) return
    const dt = Math.min(delta, 1 / 24)
    u.uTime.value = state.clock.elapsedTime
    u.uPointer.value.set(pointer.sx, pointer.sy)
    const want = reduced ? 0.12 : pointer.active ? 1 : 0.22
    energy.current += (want - energy.current) * 0.05
    u.uEnergy.value = energy.current
    u.uOpacity.value += (sceneState.values.fieldFade - u.uOpacity.value) * 0.07

    // Velocity arrives already damped and self-relaxing from the scroll tick; the
    // second damp here is only so a dropped frame cannot snap the whole field.
    const target = reduced ? 0 : clamp01(Math.abs(scroll.velocity)) * Math.sign(scroll.velocity)
    warp.current += (target * 1.15 - warp.current) * damp(7, dt)
    u.uWarp.value = warp.current

    const { a } = tintAt(scroll.progress)
    tint.current.setRGB(a[0] / 255, a[1] / 255, a[2] / 255)
    ;(u.uTint.value as THREE.Color).lerp(tint.current, 0.06)

    // Publish idle energy for the other objects (bloom gate, tag springs).
    sceneState.pointerEnergy = energy.current
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial ref={matRef} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} />
    </points>
  )
}
