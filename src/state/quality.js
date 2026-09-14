/**
 * Device capability + motion preference, resolved once, then observed.
 * The 3D scene reads `quality.tier` to decide particle counts, whether the
 * camera fly-through exists and whether bloom runs. Kept outside React state
 * for anything that must read it inside useFrame without re-rendering.
 */
const MQ = {
  mobile: '(max-width: 767px)',
  tablet: '(max-width: 1100px)',
  coarse: '(pointer: coarse)',
  reduce: '(prefers-reduced-motion: reduce)',
  lowPower: '(update: slow)',
}

const listeners = new Set()

function match(q) {
  return typeof window !== 'undefined' && window.matchMedia(q).matches
}

function detect() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location?.search || '') : null
  // Dev/QA overrides so both accessibility and no-WebGL paths can be exercised
  // without changing OS settings:  ?reduced=1  ·  ?no3d=1
  const forced = params?.get('reduced') === '1'
  const reduced = forced || match(MQ.reduce)
  const coarse = match(MQ.coarse)
  const mobile = match(MQ.mobile)
  const lowPower = match(MQ.lowPower)
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4

  let tier = 'high'
  if (reduced) tier = 'reduced'
  else if (mobile || coarse) tier = 'mobile'
  else if (lowPower || match(MQ.tablet) || cores <= 4) tier = 'medium'

  return {
    reduced,
    no3d: params?.get('no3d') === '1',
    coarse,
    mobile: mobile || coarse,
    tier,
    dpr: Math.min(dpr, mobile ? 2 : 1.75),
    // Particle budget per tier — the main lever on fill-rate.
    particles: tier === 'mobile' || tier === 'reduced' ? 900 : tier === 'medium' ? 2800 : 6000,
    // The signature interaction: scroll-driven camera path. Desktop only.
    flyThrough: tier === 'high' || tier === 'medium',
    bloom: tier === 'high' && !lowPower,
    dprRange: tier === 'high' ? [1, 1.75] : [1, 1.35],
  }
}

let state = null

export function getQuality() {
  if (!state) state = detect()
  return state
}

/** Re-renders the consumer when viewport crosses a tier or motion pref flips. */
export function subscribeQuality(cb) {
  listeners.add(cb)
  if (!subscribeQuality.bound) {
    subscribeQuality.bound = true
    for (const q of Object.values(MQ)) {
      const m = window.matchMedia(q)
      m.addEventListener?.('change', () => {
        state = detect()
        listeners.forEach((fn) => fn(state))
        // Tier changed → particle counts and pin maths must be retaken.
        import('./scroll').then(({ ScrollTrigger }) => ScrollTrigger.refresh())
      })
    }
  }
  return () => listeners.delete(cb)
}
