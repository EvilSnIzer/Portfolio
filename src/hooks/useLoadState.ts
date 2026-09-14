import { useLayoutEffect, useState } from 'react'
import { loadState, onLoadChange } from '../lib/assets'

/** Subscribe a DOM component (the preloader) to the shared load store. */
export function useLoadState() {
  const [s, setS] = useState(loadState)
  useLayoutEffect(() => onLoadChange(setS), [])
  return s
}

/**
 * Handover = "assets are in, safe to reveal". The scene's own readiness is
 * tracked separately so the hero type can wait for the WebGL layer if it wants to.
 */
export function useHandover() {
  const s = useLoadState()
  const [sceneReady, setSceneReady] = useState(false)
  return {
    progress: s.progress,
    ready: s.progress >= 0.999,
    sceneReady,
    setSceneReady,
    errors: s.errors,
    status: s.done ? 'Ready' : 'Loading assets',
  }
}
