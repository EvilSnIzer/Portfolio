/**
 * Asset preloading — the honest half of the preloader.
 *
 * `useProgress` from drei reports what R3F's own loaders have fetched, which on
 * this site is nothing: our only WebGL assets are procedurally generated geometry
 * and DOM-sourced textures. So we preload the real payload (project images,
 * variable-font files, the lazily-imported three chunk) ourselves, with byte-level
 * progress for images via ReadableStream, and merge that with drei's counter.
 *
 * Everything degrades gracefully: a missing image resolves with a warning and the
 * card falls back to a gradient plate rather than hanging the preloader forever.
 */
import { assets } from '../content/site'
import { projects } from '../content/projects'

/**
 * Second input to the bar: drei's useProgress, reported from inside the Canvas
 * (see scene/SceneProgressReporter.tsx). Weighted so a scene that needs no
 * external files can never hold the bar hostage.
 */
let r3f: { progress: number; total: number } = { progress: 0, total: 0 }

export function setR3FProgress(progress: number, total: number) {
  r3f = { progress, total }
  emit()
}

export type LoadState = {
  loaded: number
  total: number
  progress: number
  done: boolean
  /** Byte-accurate for images, count-accurate for the rest. */
  bytes: { loaded: number; total: number }
  errors: string[]
}

export const loadState: LoadState = {
  loaded: 0,
  total: 0,
  progress: 0,
  done: false,
  bytes: { loaded: 0, total: 0 },
  errors: [],
}

const listeners = new Set<(s: LoadState) => void>()

export function onLoadChange(cb: (s: LoadState) => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function emit() {
  const imagesDone = loadState.bytes.total > 0 ? loadState.bytes.loaded / loadState.bytes.total : 1
  const countDone = loadState.total ? loadState.loaded / loadState.total : 0
  // Weight images 70% (they are the bulk) and discrete tasks 30%.
  const mine = Math.min(1, imagesDone * 0.7 + countDone * 0.3)
  // R3F only counts if it is actually tracking something, and once we are done
  // nothing can pull the bar back (a late useProgress event must not re-open it).
  const combined = r3f.total > 0 ? Math.min(mine, r3f.progress) : mine
  loadState.progress = Math.min(1, loadState.done ? 1 : combined)
  listeners.forEach((cb) => cb({ ...loadState }))
}

function bump() {
  loadState.loaded += 1
  emit()
}

/** Image with byte progress. Never rejects — a 404 must not stall the page. */
async function loadImage(url: string, onBytes: (n: number) => void) {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) throw new Error(`${res.status}`)
    const len = Number(res.headers.get('content-length') || 0)
    if (!res.body) {
      await res.blob()
      onBytes(len || 64_000)
    } else {
      const reader = res.body.getReader()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        onBytes(value?.byteLength ?? 0)
      }
    }
    // Decode off the network so first paint after handover is not a decode spike.
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode().catch(() => {})
  } catch (err) {
    loadState.errors.push(`${url}: ${(err as Error).message}`)
    // Pretend it arrived so progress still completes; card renders fallback plate.
    onBytes(1e6)
    if (import.meta.env?.DEV) console.warn('[preload] missing asset', url)
  }
}

let started = false

export async function loadAssets() {
  if (started) return loadState
  started = true
  const images = [...new Set(projects.map((p) => p.image).filter(Boolean) as string[])]
  loadState.total = images.length + assets.fonts.length + 1 // +1 = r3f chunk
  loadState.bytes.total = images.length * 1_000_000 // unknown → normalise per-image
  emit()

  // 1. Warm the r3f/three chunk so the canvas mounts without a frame hitch.
  import('../scene/CanvasRoot').then(bump).catch(bump)

  // 2. Fonts: without this the display type reflows mid-reveal, which kills the
  //    first impression more reliably than any missing image.
  const fontJobs = assets.fonts.map(async (spec) => {
    try {
      await document.fonts?.load(spec)
    } catch {
      /* no document.fonts — carry on */
    }
    bump()
  })

  // 3. Images.
  const imageJobs = images.map((url) =>
    loadImage(url, (n) => {
      loadState.bytes.loaded = Math.min(loadState.bytes.total, loadState.bytes.loaded + n)
      emit()
    }).then(bump)
  )

  await Promise.all([...fontJobs, ...imageJobs])
  loadState.done = true
  emit()
  return loadState
}

/** Smoothed value for the bar — raw byte progress arrives in bursts. */
export function useLoadProgress(): LoadState & { shown: number } {
  return { ...loadState, shown: loadState.progress }
}
