import { useEffect } from 'react'
import { useProgress } from '@react-three/drei'
import { setR3FProgress } from '../lib/assets'

/**
 * Lives inside <Canvas> and mirrors drei's loader counter into the same store the
 * preloader reads. drei's `useProgress` tracks THREE.Loader handlers — since this
 * project generates its geometry procedurally, this channel is usually 0 items,
 * which is exactly why src/lib/assets.ts does the real work.
 */
export function SceneProgressReporter() {
  const { progress, total } = useProgress()
  useEffect(() => {
    setR3FProgress(progress, total)
  }, [progress, total])
  return null
}
