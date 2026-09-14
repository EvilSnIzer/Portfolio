/**
 * Unit checks for section-anchored camera timing (src/lib/sectionAnchors.js).
 *
 * The camera path used to be authored as absolute fractions of document progress,
 * which quietly couples the choreography to total page height. Making the Projects
 * pin work *changes that height* by a viewport-dependent amount (the pin's spacing),
 * so every keyframe after it would have landed in the wrong section. These tests
 * pin down the property that matters: a keyframe means "x through section S" for
 * every document shape, including ones with pin spacing, missing sections and a
 * page shorter than the viewport.
 *
 * Run: node --test scripts/anchors.test.mjs   (or: npm run test:anchors)
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { measureAnchors, progressAt } from '../src/lib/sectionAnchors.js'

const VH = 900

/** @param {{id:string, top:number, height:number}[]} rows extra = unaccounted tail */
function fakeDoc(rows, { innerHeight = VH, extra = 0 } = {}) {
  const bottom = Math.max(...rows.map((r) => r.top + r.height))
  const els = new Map(
    rows.map((r) => [r.id, { getBoundingClientRect: () => ({ top: r.top, height: r.height }) }])
  )
  return {
    documentElement: { scrollHeight: bottom + extra, scrollTop: 0 },
    getElementById: (id) => els.get(id) ?? null,
    defaultView: { innerHeight, scrollY: 0 },
  }
}

const six = (offsets) =>
  ['hero', 'about', 'skills', 'projects', 'timeline', 'contact'].map((id, i) => ({
    id,
    top: offsets[i],
    height: VH,
  }))

test('six viewport-tall sections divide progress into equal fifths', () => {
  const doc = fakeDoc(six([0, 900, 1800, 2700, 3600, 4500]), { extra: 0 })
  const { anchors } = measureAnchors(['hero', 'about', 'skills', 'projects', 'timeline', 'contact'], doc)
  assert.ok(Math.abs(anchors.about.start - 0.2) < 1e-9)
  assert.ok(Math.abs(anchors.projects.start - 0.6) < 1e-9)
  assert.ok(Math.abs(anchors.contact.start - 1) < 1e-9, 'last section starts at the scroll bottom')
})

test('halfway through a section is its start plus half its span', () => {
  const ids = ['hero', 'about', 'skills', 'projects', 'timeline', 'contact']
  const doc = fakeDoc(six([0, 900, 1800, 2700, 3600, 4500]), { extra: 0 })
  const { anchors } = measureAnchors(ids, doc)
  const { max } = measureAnchors(ids, doc)
  assert.equal(max, 4500)
  // about spans 900..1800 of 4500 → 0.2 → 0.4, so 0.6 through it is 0.32.
  assert.ok(Math.abs(progressAt(anchors, 'about', 0.6) - 0.32) < 1e-9)
})

test('pin spacing on an earlier section is absorbed by that section, not smeared', () => {
  const ids = ['hero', 'about', 'skills', 'projects', 'timeline', 'contact']
  // Projects owns 900px of section plus 720px of pin spacer before Timeline starts.
  const pinned = six([0, 900, 1800, 2700, 4320, 5220])
  const { anchors } = measureAnchors(ids, fakeDoc(pinned, { extra: 0 }))
  const span = (id) => anchors[id].span
  assert.ok(span('projects') > span('about'), 'the pinned run must own its extra scroll')
  assert.ok(Math.abs(span('projects') - 1620 / 5220) < 1e-9)
  // The key that used to break: Timeline's choreography starts *at* Timeline.
  assert.ok(Math.abs(progressAt(anchors, 'timeline', 0) - anchors.timeline.start) < 1e-9)
  assert.ok(progressAt(anchors, 'timeline', 0.12) > anchors.timeline.start)
  assert.ok(progressAt(anchors, 'timeline', 0.12) < anchors.contact.start)
})

test('a pinned rail with no travel (wide viewport) does not stall the path', () => {
  const ids = ['hero', 'about', 'skills', 'projects', 'timeline', 'contact']
  const { anchors } = measureAnchors(ids, fakeDoc(six([0, 900, 1800, 2700, 3600, 4500]), { extra: 0 }))
  const before = progressAt(anchors, 'timeline', 0.12)
  const withPin = measureAnchors(ids, fakeDoc(six([0, 900, 1800, 2700, 4320, 5220]), { extra: 0 }))
  const after = progressAt(withPin.anchors, 'timeline', 0.12)
  assert.notEqual(before, after, 'anchor must track the real geometry, not a constant')
  assert.ok(after > before, 'extra page height pushes later sections later in progress')
})

test('keyframes stay monotonic and inside 0..1 for every authored anchor', () => {
  const ids = ['hero', 'about', 'skills', 'projects', 'timeline', 'contact']
  const { anchors } = measureAnchors(ids, fakeDoc(six([0, 900, 1800, 2700, 4320, 5220]), { extra: 0 }))
  const ts = ids.flatMap((id) => [0, 0.35, 0.6, 1].map((at) => progressAt(anchors, id, at)))
  for (const t of ts) {
    assert.ok(t >= 0 && t <= 1, `progress ${t} escaped 0..1`)
    assert.ok(Number.isFinite(t), 'progress must be finite')
  }
})

test('a missing section is skipped without poisoning the map with NaN', () => {
  const ids = ['hero', 'ghost', 'about']
  const doc = fakeDoc(
    [
      { id: 'hero', top: 0, height: 900 },
      { id: 'about', top: 900, height: 900 },
    ],
    { extra: 0 }
  )
  const { anchors } = measureAnchors(ids, doc)
  assert.deepEqual(anchors.ghost, { start: 0, span: 0 })
  assert.ok(Number.isFinite(progressAt(anchors, 'about', 0.5)))
  assert.equal(progressAt(anchors, 'ghost', 0.5), 0)
})

test('a document shorter than the viewport still yields usable numbers', () => {
  const ids = ['hero', 'about']
  const doc = fakeDoc(
    [
      { id: 'hero', top: 0, height: 400 },
      { id: 'about', top: 400, height: 400 },
    ],
    { innerHeight: 900, extra: 0 }
  )
  const { max, anchors } = measureAnchors(ids, doc)
  assert.equal(max, 1, 'no scroll range → guarded denominator, never 0')
  for (const id of ids) {
    assert.ok(anchors[id].start >= 0)
    assert.ok(anchors[id].span > 0)
  }
})

test('a section shorter than the viewport at the page end cannot overflow progress', () => {
  const ids = ['hero', 'about', 'contact']
  // contact top sits past max (900·2 = 1800 vs max 2100-900=1200): clamp, don't exceed.
  const doc = fakeDoc(
    [
      { id: 'hero', top: 0, height: 900 },
      { id: 'about', top: 900, height: 900 },
      { id: 'contact', top: 2000, height: 100 },
    ],
    { extra: 0 }
  )
  const { anchors } = measureAnchors(ids, doc)
  assert.ok(progressAt(anchors, 'contact', 1) <= 1)
  assert.ok(progressAt(anchors, 'about', 1) <= anchors.contact.start + 1e-9)
})
