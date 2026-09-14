// Minimal DOM stubs: enough for render-phase code paths (matchMedia, canvas, dpr).
const noop = () => {}
const styleMock = () =>
  new Proxy({ cssText: '' }, {
    get: (t, k) => {
      if (k === 'getPropertyValue') return () => ''
      if (k in t) return t[k]
      return typeof k === 'string' && /[A-Z]/.test(k) ? noop : ''
    },
    set: (t, k, v) => ((t[k] = v), true),
  })
globalThis.matchMedia = (q) => ({ matches: false, media: q, addEventListener: noop, removeEventListener: noop })
globalThis.devicePixelRatio = 1
globalThis.innerWidth = 1440
globalThis.innerHeight = 900
globalThis.scrollY = 0
const ctx = {
  fillRect: noop, createLinearGradient: () => ({ addColorStop: noop }),
  createRadialGradient: () => ({ addColorStop: noop }), beginPath: noop, moveTo: noop,
  lineTo: noop, stroke: noop, set fillStyle(_) {}, set strokeStyle(_) {}, set lineWidth(_) {},
}
const mkEl = (tag = 'div') => ({
  tagName: tag.toUpperCase(), style: styleMock(), children: [], dataset: {}, id: '',
  classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
  appendChild(c) { this.children.push(c); return c }, removeChild(c) { return c },
  insertBefore(c) { return c }, append: noop, prepend: noop, remove: noop,
  setAttribute: noop, getAttribute: () => null, removeAttribute: noop,
  hasAttribute: () => false, toggleAttribute: () => false,
  cloneNode() { return mkEl(this.tagName) }, contains: () => false,
  addEventListener: noop, removeEventListener: noop, dispatchEvent: () => true,
  getBoundingClientRect: () => ({ top: 0, left: 0, width: 1440, height: 900, right: 1440, bottom: 900, x: 0, y: 0 }),
  getClientRects: () => [{ top: 0, left: 0, width: 10, height: 10 }],
  querySelectorAll: () => [], querySelector: () => null, focus: noop, blur: noop,
  offsetWidth: 100, offsetHeight: 30, clientWidth: 1440, clientHeight: 900,
  scrollWidth: 1440, scrollHeight: 900, scrollTop: 0, scrollLeft: 0,
  offsetTop: 0, offsetLeft: 0, offsetParent: null, parentNode: null, parentElement: null,
  firstChild: null, lastChild: null, nextSibling: null, ownerDocument: null,
  innerHTML: '', outerHTML: '', textContent: '', innerText: '', nodeType: 1,
})
globalThis.document = {
  documentElement: { style: styleMock(), classList: { add: noop, remove: noop, toggle: noop }, scrollHeight: 9000 },
  body: Object.assign(mkEl('body'), { style: {} }),
  fonts: { ready: Promise.resolve(), load: () => Promise.resolve() },
  hidden: false,
  getElementById: () => null,
  querySelector: () => null,
  createElement: (t) => Object.assign(mkEl(t), { width: 0, height: 0, getContext: () => ctx, toDataURL: () => '' }),
  createElementNS: (ns, t) => mkEl(t),
  createTextNode: (t) => ({ textContent: t }),
  createRange: () => ({ selectNodeContents: noop, getBoundingClientRect: () => ({ top: 0, left: 0, width: 10, height: 10 }), cloneRange: () => ({}), setStart: noop, setEnd: noop, commonAncestorElement: null }),
  getElementsByTagName: () => [mkEl('html')],
  addEventListener: noop, removeEventListener: noop,
  querySelectorAll: () => [],
}
globalThis.window = globalThis
globalThis.Window = class {}
globalThis.HTMLElement = class {}
globalThis.ResizeObserver = class { observe(){} disconnect(){} unobserve(){} }
globalThis.IntersectionObserver = class { observe(){} disconnect(){} unobserve(){} }
globalThis.history = { scrollRestoration: 'auto', state: null }
// navigator exists in node ≥21
globalThis.location = { href: 'http://localhost/', hash: '' }
globalThis.addEventListener = noop
globalThis.removeEventListener = noop
globalThis.requestAnimationFrame = () => 0
globalThis.cancelAnimationFrame = noop
globalThis.performance = globalThis.performance || { now: () => 0 }
globalThis.Image = class { set src(_) {} decode() { return Promise.resolve() } }
globalThis.fetch = async () => ({ ok: false, headers: { get: () => 0 }, blob: async () => new Blob([]), body: null })

const out = await import('./dist/entry.js')
const html = out.default()
console.log('RENDER OK · length', html.length)
// Assertions: everything a crawler or screen reader needs must be in the DOM.
const must = [
  'Manan Sharma', 'AI/ML Engineer', 'id="hero"', 'id="about"', 'id="skills"', 'id="projects"',
  'id="timeline"', 'id="contact"', 'Crypto Trade Outcome Predictor', 'Crypto Spark Pipeline',
  'CRM Funnel Intelligence', 'github.com/EvilSnIzer', 'skip-link', 'PySpark', 'scikit-learn',
  'Reliable data', 'Walk-Forward CV',
]
const missing = must.filter((m) => !html.includes(m))
console.log(missing.length ? 'MISSING FROM DOM: ' + missing.join(' | ') : 'ALL CONTENT PRESENT IN DOM ✓')
const counts = (re) => (html.match(re) || []).length
console.log('sections:', counts(/<section id=/g), '| h2:', counts(/<h2/g), '| h3:', counts(/<h3/g),
  '| aria-hidden blocks:', counts(/aria-hidden="true"/g), '| TODO marks:', counts(/TODO/g))
const h1 = (html.match(/<h1[^>]*>[\s\S]*?<\/h1>/) || [''])[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
console.log('\nH1 TEXT →', JSON.stringify(h1))
console.log('h1 count:', counts(/<h1/g))
console.log('main landmark:', html.includes('<main id="main"'), '| section labels:', counts(/aria-labelledby=/g))
console.log('decorative canvas layer hidden:', /aria-hidden="true"[^>]*class="pointer-events-none fixed inset-0 z-0/.test(html))
