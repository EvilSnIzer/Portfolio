/**
 * Pointer state, kept outside React so both the WebGL layer and the DOM
 * springs can read it every frame without triggering renders.
 * Normalised space: x,y ∈ [-1, 1] with (0,0) at viewport centre.
 */
export const pointer = {
  x: 0,
  y: 0,
  /** Damped — used for camera/parallax so fast mouse moves don't snap. */
  sx: 0,
  sy: 0,
  px: 0, // pixels
  py: 0,
  active: false,
  lastMove: 0,
}

let bound = false

export function bindPointer() {
  if (bound || typeof window === 'undefined') return () => {}
  bound = true

  const set = (cx, cy) => {
    pointer.px = cx
    pointer.py = cy
    pointer.x = (cx / window.innerWidth) * 2 - 1
    pointer.y = -((cy / window.innerHeight) * 2 - 1)
    pointer.active = true
    pointer.lastMove = performance.now()
  }

  const onMove = (e) => set(e.clientX, e.clientY)
  const onTouch = (e) => {
    const t = e.touches?.[0]
    if (t) set(t.clientX, t.clientY)
  }
  const onLeave = () => {
    pointer.active = false
  }

  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('touchmove', onTouch, { passive: true })
  window.addEventListener('pointerleave', onLeave, { passive: true })

  return () => {
    bound = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('touchmove', onTouch)
    window.removeEventListener('pointerleave', onLeave)
  }
}

/** Call once per frame from a single rAF owner (the scroll engine ticker). */
export function dampPointer(k = 0.075) {
  pointer.sx += (pointer.x - pointer.sx) * k
  pointer.sy += (pointer.y - pointer.sy) * k
}
