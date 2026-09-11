import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { sceneState } from './sceneState'
import { skillNodes } from '../state/skills'
import { smoothstep } from '../lib/damp'
import { scroll } from '../state/scroll'

/**
 * Connective tissue for the Skills section: lines drawn between the floating DOM
 * tags. There is no second copy of the layout — the positions are unprojected back
 * into world space from `sceneState.nodes`, which the DOM spring engine writes.
 *
 * Unprojection: screen → NDC → view ray → intersect the horizontal plane that
 * contains the scene centre, which keeps the lines anchored to the tags as the
 * camera moves instead of floating on a fixed-depth quad.
 */
const PLANE_Z = -0.8

type Node = { x: number; y: number; group: string; seed: number }

function nearestEdges(nodes: Node[], maxPerNode = 2) {
  const edges: [number, number][] = []
  const seen = new Set<string>()
  for (let i = 0; i < nodes.length; i++) {
    const cands: { j: number; d: number }[] = []
    for (let j = 0; j < nodes.length; j++) {
      if (i === j || nodes[i].group !== nodes[j].group) continue
      cands.push({ j, d: Math.hypot(nodes[i].x - nodes[j].x, (nodes[i].y - nodes[j].y) * 1.6) })
    }
    cands.sort((a, b) => a.d - b.d)
    for (const { j } of cands.slice(0, maxPerNode)) {
      const k = `${Math.min(i, j)}-${Math.max(i, j)}`
      if (!seen.has(k) && cands.length) {
        seen.add(k)
        edges.push([i, j])
      }
    }
  }
  return edges
}

export function SkillLinks() {
  const geoRef = useRef<THREE.BufferGeometry>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const edges = useMemo(() => {
    // Layout is stable, so the graph is computed once from the normalised centres.
    const snapshot = skillNodes.map((n) => ({ x: n.nx * 2 - 1, y: -(n.ny * 2 - 1), group: n.group, seed: n.seed }))
    return nearestEdges(snapshot, 2)
  }, [])


  const alpha = useMemo(() => new Float32Array(Math.max(2, edges.length * 2)), [edges])
  const pos = useMemo(() => new Float32Array(Math.max(6, edges.length * 6)), [edges])

  const uniforms = useMemo(
    () => ({
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color('#f3a63b') },
    }),
    []
  )

  useFrame(() => {
    const pts = sceneState.nodes
    if (!geoRef.current || !pts || pts.length < skillNodes.length) return
    const s = scroll.section.skills ?? 0
    const vis = smoothstep(0.02, 0.22, s) * (1 - smoothstep(0.82, 1.0, s))

    for (let e = 0; e < edges.length; e++) {
      const [a, b] = edges[e]
      const pa = pts[a]
      const pb = pts[b]
      if (!pa || !pb) continue
      const za = PLANE_Z - pa.y * 1.1
      const zb = PLANE_Z - pb.y * 1.1
      pos[e * 6 + 0] = pa.x * 5.4
      pos[e * 6 + 1] = pa.y * 3.1 - 0.95
      pos[e * 6 + 2] = za
      pos[e * 6 + 3] = pb.x * 5.4
      pos[e * 6 + 4] = pb.y * 3.1 - 0.95
      pos[e * 6 + 5] = zb
      alpha[e * 2] = 1
      alpha[e * 2 + 1] = 1
    }

    geoRef.current.attributes.position.needsUpdate = true
    geoRef.current.attributes.aAlpha.needsUpdate = true
    if (matRef.current) matRef.current.uniforms.uOpacity.value = vis * 0.55
  })

  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" array={pos} count={pos.length / 3} itemSize={3} />
        <bufferAttribute attach="attributes-aAlpha" array={alpha} count={alpha.length} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          attribute float aAlpha;
          varying float vA;
          void main(){
            vA = aAlpha;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`}
        fragmentShader={`
          uniform float uOpacity;
          uniform vec3 uColor;
          varying float vA;
          void main(){
            float a = uOpacity * vA;
            if (a < 0.004) discard;
            gl_FragColor = vec4(uColor, a);
          }`}
      />
    </lineSegments>
  )
}
