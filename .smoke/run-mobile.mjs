import { readFileSync } from 'node:fs'
const base = readFileSync('./.smoke/run.mjs', 'utf8').replace(
  "globalThis.matchMedia = (q) => ({ matches: false,",
  "globalThis.matchMedia = (q) => ({ matches: /mobile|coarse/.test(q),"
).replace(/console\.log\('\\nH1 TEXT[\s\S]*$/, "")
const f = './.smoke/_mobile.mjs'
import { writeFileSync } from 'node:fs'
writeFileSync(f, base + `
console.log('MOBILE/REDUCED RENDER OK · length', html.length)
console.log('rail is touch-mode (no pin copy):', !html.includes('Scroll → the rail moves'))
console.log('skills dl present:', html.includes('<dl'), '| tags still decorative:', (html.match(/aria-hidden="true"/g)||[]).length > 20)
`)
await import(f)
