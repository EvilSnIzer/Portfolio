import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { NOISE, makeGlowCanvas } from './glsl'
import { sceneState } from './sceneState'
import { mulberry32 } from '../lib/damp'

/**
 * THE morph (About section): a parametric torus knot that grows into an organic,
 * neural point-cloud sphere as you scroll, driven by `sceneState.values.morph`
 * — which only ever comes from the camera timeline. No second animation source.
 *
 * Two draw calls: a point cloud for the shape, and line segments for the
 * connective "synapses" that only exist once the shape has gone organic.
 * The blend happens in the vertex shader between two equal-length vertex sets,
 * so there is no geometry rebuild and no CPU vertex loop at scroll time.
 */

const KNOT_P = 2
const KNOT_Q = 3
const KNOT_R = 0.82
const KNOT_TUBE = 0.4
const N = 1000

/** p,q torus knot, parameterised so it matches TorusKnotGeometry's silhouette. */
function knotPoint(t: number, out: THREE.Vector3) {
  const u = KNOT_Q * t
  const cu = Math.cos(u)
  const su = Math.sin(u)
  const quOverP = (KNOT_Q / KNOT_P) * t
  const cs = Math.cos(quOverP)
  out.set(
    KNOT_R * (2 + cs) * 0.5 * cu,
    KNOT_R * (2 + cs) * su * 0.5,
    KNOT_R * Math.sin(quOverP) * 0.5
  )
  return out
}

function build() {
  const rnd = mulberry32(90210)
  const posA = new Float32Array(N * 3)
  const posB = new Float32Array(N * 3)
  const seed = new Float32Array(N)
  const shell = new Float32Array(N)
  const v = new THREE.Vector3()
  const tmp = new THREE.Vector3()

  const sphereAt = (i: number, total: number, radius: number, jitter: number) => {
    // Fibonacci sphere → even distribution, no pole clumping.
    const k = i + 0.5
    const phi = Math.acos(1 - (2 * k) / total)
    const theta = Math.PI * (1 + Math.sqrt(5)) * k
    const r = radius * (1 + jitter * (rnd() - 0.5))
    tmp.setFromSphericalCoords(r, phi, theta)
    return tmp
  }

  for (let i = 0; i < N; i++) {
    // A: torus knot curve, thickened with a small ring so it reads as a volume.
    const t = (i / N) * Math.PI * 2 * KNOT_P
    knotPoint(t, v)
    const ring = (i % 7) / 7
    const ang = ring * Math.PI * 2
    const rad = KNOT_TUBE * (0.35 + rnd() * 0.75)
    posA[i * 3] = v.x + Math.cos(ang) * rad * 0.55
    posA[i * 3 + 1] = v.y + Math.sin(ang) * rad * 0.55
    posA[i * 3 + 2] = v.z + Math.cos(ang + 1.1) * rad * 0.55

    // B: organic neural sphere — two shells, inner one sparser.
    const isInner = i % 5 === 0
    const s = sphereAt(
      isInner ? i * 3 : i,
      N * (isInner ? 1.6 : 1),
      isInner ? 0.78 : 1.5,
      isInner ? 0.5 : 0.26
    )
    posB[i * 3] = s.x
    posB[i * 3 + 1] = s.y
    posB[i * 3 + 2] = s.z

    seed[i] = rnd()
    shell[i] = isInner ? 0 : 1
  }

  // ── connective lines ───────────────────────────────────────────────────
  const linkA: number[] = []
  const linkB: number[] = []
  const push = (arr: number[], i: number, j: number) => {
    arr.push(i, j)
  }
  for (let i = 0; i < N - 1; i += 1) {
    // Knot: follow the curve, plus braid chords → wire-frame tube feel.
    push(linkA, i, i + 1)
    if (i % 9 === 0) push(linkA, i, Math.min(N - 1, i + 4))
  }
  // Organic: nearest-neighbour synapses, capped so the graph stays legible.
  const maxSeg = 1400
  const maxDist = 0.46
  const grid = new Map<string, number[]>()
  const cell = maxDist
  const key = (x: number, y: number, z: number) =>
    `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`
  for (let i = 0; i < N; i++) {
    const k = key(posB[i * 3], posB[i * 3 + 1], posB[i * 3 + 2])
    if (!grid.has(k)) grid.set(k, [])
    grid.get(k)!.push(i)
  }
  let segs = 0
  for (let i = 0; i < N && segs < maxSeg; i++) {
    const cx = Math.floor(posB[i * 3] / cell)
    const cy = Math.floor(posB[i * 3 + 1] / cell)
    const cz = Math.floor(posB[i * 3 + 2] / cell)
    for (let dx = -1; dx <= 1 && segs < maxSeg; dx++)
      for (let dy = -1; dy <= 1 && segs < maxSeg; dy++)
        for (let dz = -1; dz <= 1 && segs < maxSeg; dz++) {
          const bucket = grid.get(`${cx + dx},${cy + dy},${cz + dz}`)
          if (!bucket) continue
          for (const j of bucket) {
            if (j <= i) continue
            const d = Math.hypot(
              posB[i * 3] - posB[j * 3],
              posB[i * 3 + 1] - posB[j * 3 + 1],
              posB[i * 3 + 2] - posB[j * 3 + 2]
            )
            if (d < maxDist) {
              push(linkB, i, j)
              segs++
              break
            }
          }
        }
  }

  const ptsGeo = new THREE.BufferGeometry()
  ptsGeo.setAttribute('position', new THREE.BufferAttribute(posA, 3))
  ptsGeo.setAttribute('aMorphTo', new THREE.BufferAttribute(posB, 3))
  ptsGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  ptsGeo.setAttribute('aShell', new THREE.BufferAttribute(shell, 1))

  const lineGeoA = new THREE.BufferGeometry()
  lineGeoA.setAttribute('position', new THREE.BufferAttribute(posA, 3))
  lineGeoA.setAttribute('aMorphTo', new THREE.BufferAttribute(posB, 3))
  lineGeoA.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  lineGeoA.setAttribute('aShell', new THREE.BufferAttribute(shell, 1))
  lineGeoA.setIndex(linkA)

  const lineGeoB = new THREE.BufferGeometry()
  lineGeoB.setAttribute('position', new THREE.BufferAttribute(posB, 3))
  lineGeoB.setAttribute('aMorphTo', new THREE.BufferAttribute(posB, 3))
  lineGeoB.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  lineGeoB.setAttribute('aShell', new THREE.BufferAttribute(shell, 1))
  lineGeoB.setIndex(linkB)

  return { ptsGeo, lineGeoA, lineGeoB }
}

const morphVert = /* glsl */ `
uniform float uTime, uMorph, uSize, uPixelRatio, uMotion;
attribute vec3  aMorphTo;
attribute float aSeed;
attribute float aShell;
varying float vEnergy;
varying float vSeed;
${NOISE}
void main(){
  float m = smoothstep(0.0, 1.0, uMorph);
  vec3 dirA = normalize(position + vec3(1e-5));
  vec3 dirB = normalize(aMorphTo + vec3(1e-5));
  // Slerp-ish blend so the cloud inflates instead of collapsing through centre.
  vec3 dir = normalize(mix(dirA, dirB, m));
  vec3 p = mix(position, aMorphTo, m);

  // Noise displacement ramps up with the morph: mid-transition the surface
  // "boils", which is what sells it as growth rather than a crossfade.
  float n = snoise(p * 1.75 + vec3(0.0, 0.0, uTime * 0.22));
  p += dir * n * (0.05 + 0.40 * m) * (0.35 + 0.65 * aShell) * uMotion;
  p += dir * sin(uTime * 0.85 + aSeed * 6.283) * 0.014 * uMotion;

  vEnergy = 0.5 + 0.5 * n;
  vSeed   = aSeed;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * (0.55 + aSeed * 1.25) * (uPixelRatio / max(0.4, -mv.z));
  gl_Position = projectionMatrix * mv;
}
`

const morphFrag = /* glsl */ `
uniform float uOpacity;
uniform vec3 uColor;
uniform vec3 uAccent;
uniform sampler2D uSprite;
varying float vEnergy;
varying float vSeed;
void main(){
  float a = texture2D(uSprite, gl_PointCoord).a;
  float alpha = a * uOpacity * (0.30 + vEnergy * 0.85);
  if (alpha < 0.006) discard;
  vec3 col = mix(uColor, uAccent, smoothstep(0.78, 1.0, vSeed) * 0.7);
  gl_FragColor = vec4(col * (0.75 + vEnergy * 0.7), alpha);
}
`

const lineFrag = /* glsl */ `
uniform float uOpacity;
uniform vec3 uColor;
uniform vec3 uAccent;
varying float vEnergy;
varying float vSeed;
void main(){
  float alpha = uOpacity * (0.10 + vEnergy * 0.30);
  if (alpha < 0.004) discard;
  vec3 col = mix(uColor, uAccent, smoothstep(0.55, 1.0, vSeed) * 0.55);
  gl_FragColor = vec4(col, alpha);
}
`

const lineVert = /* glsl */ `
uniform float uTime, uMorph, uMotion;
attribute vec3  aMorphTo;
attribute float aSeed;
attribute float aShell;
varying float vEnergy;
varying float vSeed;
${NOISE}
void main(){
  float m = smoothstep(0.0, 1.0, uMorph);
  vec3 dirA = normalize(position + vec3(1e-5));
  vec3 dirB = normalize(aMorphTo + vec3(1e-5));
  vec3 dir = normalize(mix(dirA, dirB, m));
  vec3 p = mix(position, aMorphTo, m);
  float n = snoise(p * 1.75 + vec3(0.0, 0.0, uTime * 0.22));
  p += dir * n * (0.05 + 0.40 * m) * (0.35 + 0.65 * aShell) * uMotion;
  vEnergy = 0.5 + 0.5 * n;
  vSeed = aSeed;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

export function MorphCore({ reduced = false }: { reduced?: boolean }) {
  const group = useRef<THREE.Group>(null)
  const ptsMat = useRef<THREE.ShaderMaterial>(null)
  const knotMat = useRef<THREE.ShaderMaterial>(null)
  const webMat = useRef<THREE.ShaderMaterial>(null)
  const opacity = useRef(0)

  const sprite = useMemo(() => {
    const t = new THREE.CanvasTexture(makeGlowCanvas(64))
    t.colorSpace = THREE.SRGBColorSpace
    t.generateMipmaps = false
    return t
  }, [])

  const geo = useMemo(build, [])
  useLayoutEffect(
    () => () => {
      geo.ptsGeo.dispose()
      geo.lineGeoA.dispose()
      geo.lineGeoB.dispose()
      sprite.dispose()
    },
    [geo, sprite]
  )

  const base = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uOpacity: { value: 0 },
      uSize: { value: 110 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.75) },
      uMotion: { value: reduced ? 0.2 : 1 },
      uColor: { value: new THREE.Color('#f2f2f0') },
      uAccent: { value: new THREE.Color('#f3a63b') },
      uSprite: { value: sprite },
    }),
    [sprite, reduced]
  )

  useFrame((state, delta) => {
    const v = sceneState.values
    const dt = Math.min(delta, 1 / 24)
    // Follow the timeline value with a spring, so the shape has mass.
    opacity.current += (v.knotOpacity - opacity.current) * (1 - Math.exp(-5 * dt))
    const morph = v.morph

    for (const m of [ptsMat.current, knotMat.current, webMat.current]) {
      if (!m) continue
      m.uniforms.uTime.value = state.clock.elapsedTime
      m.uniforms.uMorph.value = morph
      m.uniforms.uOpacity.value = opacity.current
    }
    if (webMat.current) {
      // Synapses only appear once the knot has gone organic.
      webMat.current.uniforms.uOpacity.value = opacity.current * THREE.MathUtils.smoothstep(morph, 0.42, 0.95)
    }
    if (group.current) {
      const s = 1.62 * (1 + morph * 0.12)
      group.current.scale.setScalar(s)
      const spin = reduced ? 0.045 : 0.115
      group.current.rotation.y = state.clock.elapsedTime * spin + morph * 0.85
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.21) * 0.13
    }
  })

  return (
    <group ref={group} position={[0, 0.3, -0.6]}>
      <points geometry={geo.ptsGeo} frustumCulled={false}>
        <shaderMaterial
          ref={ptsMat}
          uniforms={{ ...base }}
          vertexShader={morphVert}
          fragmentShader={morphFrag}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <lineSegments geometry={geo.lineGeoA} frustumCulled={false}>
        <shaderMaterial
          ref={knotMat}
          uniforms={{ ...base }}
          vertexShader={lineVert}
          fragmentShader={lineFrag}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      <lineSegments geometry={geo.lineGeoB} frustumCulled={false}>
        <shaderMaterial
          ref={webMat}
          uniforms={{ ...base }}
          vertexShader={lineVert}
          fragmentShader={lineFrag}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  )
}
