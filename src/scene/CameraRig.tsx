import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { sceneState } from './sceneState'
import { cameraPath, ambientPath } from './scenePath'
import { pointer } from '../state/pointer'
import { damp } from '../lib/damp'

/**
 * The one and only camera controller.
 *
 * A single ScrollTrigger timeline tweens `sceneState.cam` / `.look` / `.values`;
 * `useFrame` only *follows* those targets with a frame-rate-independent spring.
 * That split is what makes the motion read as expensive rather than mechanical:
 * the timeline owns the choreography, the follower owns the weight.
 *
 * `p` is absolute document progress, so segment duration is proportional to how
 * much scroll each move occupies — long pinned sections hold the camera still.
 */
export function CameraRig({ flyThrough = true, reduced = false, introKey = 0, onReady }) {
  const { camera } = useThree()
  const t = useRef(0)
  const intro = useRef({ k: 1 })
  const cur = useRef(new THREE.Vector3(...cameraPath[0].pos))
  const look = useRef(new THREE.Vector3(...cameraPath[0].look))

  useEffect(() => {
    const cam = sceneState.cam
    const lk = sceneState.look
    const vals = sceneState.values

    if (!flyThrough) {
      // Ambient mode: nothing to scrub, keep the authored centre so the follower
      // has a stable baseline to orbit around.
      gsap.set(cam, { x: 0, y: ambientPath.y, z: 0 })
      gsap.set(lk, { x: ambientPath.look[0], y: ambientPath.look[1], z: ambientPath.look[2] })
      gsap.set(vals, { knotOpacity: 0.85, morph: 0.55, fieldFade: 1, focus: 0.3, tube: 0.35 })
      return
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power1.inOut' },
      scrollTrigger: {
        // The scroller is the window itself; one timeline for the whole journey.
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.15,
        invalidateOnRefresh: true,
      },
    })

    const a = cameraPath[0]
    tl.set(cam, { x: a.pos[0], y: a.pos[1], z: a.pos[2] }, 0)
    tl.set(lk, { x: a.look[0], y: a.look[1], z: a.look[2] }, 0)
    tl.set(vals, { ...a.values }, 0)

    for (let i = 1; i < cameraPath.length; i++) {
      const prev = cameraPath[i - 1]
      const next = cameraPath[i]
      const at = next.p
      const dur = at - prev.p
      tl.to(cam, { x: next.pos[0], y: next.pos[1], z: next.pos[2], duration: dur }, prev.p)
      tl.to(lk, { x: next.look[0], y: next.look[1], z: next.look[2], duration: dur }, prev.p)
      tl.to(vals, { ...next.values, duration: dur }, prev.p)
    }
    tl.to({}, { duration: 0.001 }, 1)

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [flyThrough])

  // ── intro dolly, released when the preloader hands over ──────────────────
  // `introKey` flips at handover: without it the dolly would play (and finish)
  // behind the preloader curtain, which is the one moment worth spending motion on.
  useEffect(() => {
    if (reduced) {
      intro.current.k = 0
      sceneState.ready = true
      onReady?.()
      return
    }
    intro.current.k = 1
    const tw = gsap.to(intro.current, {
      k: 0,
      duration: 2.4,
      ease: 'expo.out',
      delay: 0.04,
      onComplete: () => {
        sceneState.ready = true
        onReady?.()
      },
    })
    return () => tw.kill()
  }, [reduced, introKey, onReady])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 24)
    t.current += dt
    const cam = sceneState.cam
    const lk = sceneState.look

    let tx = cam.x
    let ty = cam.y
    let tz = cam.z

    if (!flyThrough) {
      const a = t.current * ambientPath.speed
      tx = Math.sin(a) * ambientPath.radius
      tz = Math.cos(a) * ambientPath.radius
      ty = cam.y + Math.sin(a * 1.7) * 0.45
    }

    // Intro offset: dolly in from further back while the brand mark settles.
    tz += intro.current.k * 5.6
    ty += intro.current.k * 0.7

    const k = damp(flyThrough ? 7.5 : 2.4, dt)
    cur.current.x += (tx - cur.current.x) * k
    cur.current.y += (ty - cur.current.y) * k
    cur.current.z += (tz - cur.current.z) * k
    look.current.x += (lk.x - look.current.x) * k
    look.current.y += (lk.y - look.current.y) * k
    look.current.z += (lk.z - look.current.z) * k

    // Cursor parallax — small enough to read as lens float, not a mouse toy.
    const px = pointer.sx * 0.36
    const py = pointer.sy * 0.24
    camera.position.set(cur.current.x + px, cur.current.y + py, cur.current.z)
    camera.lookAt(look.current.x + px * 0.32, look.current.y + py * 0.32, look.current.z)
    camera.updateMatrixWorld()
  })

  return null
}
