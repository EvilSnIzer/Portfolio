/**
 * Unit checks for the rail arithmetic (src/lib/rail.js) and the shared palette.
 *
 * These exist because the Projects bug was invisible to every check the repo had:
 * the travel measurement returned 0, so the pin simply had no length and nothing
 * threw. The math is now pure, so the invariants that *would* have caught it are
 * testable with no DOM at all.
 *
 * Two of these assertions killed the first version of this fix: "every next press
 * must move the rail" and "index → travel position must be monotonic" both failed
 * for an edge-aligned model, because 5 cards at 1440px leave only 720px of travel
 * and the last three targets clamped onto the same pixel. That is why focus is
 * distributed across the available travel instead of aligned to a card edge.
 *
 * Run: node --test scripts/rail.test.mjs   (or: npm run test:rail)
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  focusOffset,
  indexForProgress,
  offsetForIndex,
  offsetForProgress,
  progressForIndex,
  progressForOffset,
  railTravel,
} from '../src/lib/rail.js'
import { tintAt, STOPS } from '../src/lib/palette.js'

// Real geometry of the shipped rail: 5 cards, 400px wide, 40px gap, 1440 viewport.
const GEOM = { n: 5, cardW: 400, gap: 40, inset: 0, vpW: 1440 }

test('travel is positive whenever the rail overflows the viewport', () => {
  const travel = railTravel(GEOM)
  // 5·400 + 4·40 = 2160 of content, minus a 1440 viewport → 720
  assert.equal(travel, 720)
  assert.ok(travel > 0, 'REGRESSION: travel of 0 means the pin has no scroll length')
})

test('the display:contents failure mode still reports zero, and is guardable', () => {
  // A wrapper with no layout box yields no geometry → 0 travel. The section now
  // measures the real track; this pins the failure shape so the guard has meaning.
  assert.equal(railTravel({ ...GEOM, cardW: 0, gap: 0 }), 0)
  assert.ok(railTravel(GEOM) > 0)
})

test('a rail shorter than the viewport needs no travel', () => {
  assert.equal(railTravel({ n: 2, cardW: 300, gap: 40, inset: 0, vpW: 1440 }), 0)
})

test('no cards → no travel, no NaN anywhere', () => {
  assert.equal(railTravel({ n: 0, cardW: 400, gap: 40, inset: 0, vpW: 1440 }), 0)
  assert.equal(offsetForIndex(0, 0, 720), 0)
  assert.equal(progressForOffset(100, 0), 0)
  assert.equal(indexForProgress(0.5, 0), 0)
  assert.equal(focusOffset(0, 0, 0.5), 0)
})

test('every next press actually moves the rail (monotonic, no clamped ties)', () => {
  const travel = railTravel(GEOM)
  const n = GEOM.n
  const xs = Array.from({ length: n }, (_, i) => offsetForIndex(i, n, travel))
  for (let i = 1; i < n; i++) {
    assert.ok(xs[i] - xs[i - 1] > 1, `card ${i} moved ${xs[i] - xs[i - 1]}px — a dead press`)
  }
  for (const x of xs) assert.ok(x >= 0 && x <= travel, `offset ${x} outside travel`)
})

test('first press starts at 0 and the last card lands flush with the right edge', () => {
  const travel = railTravel(GEOM)
  assert.equal(offsetForIndex(0, GEOM.n, travel), 0)
  assert.equal(offsetForIndex(GEOM.n - 1, GEOM.n, travel), travel)
})

test('progress ↔ offset round-trips across the whole pin', () => {
  const travel = railTravel(GEOM)
  for (const p of [0, 0.13, 0.5, 0.77, 1]) {
    const back = progressForOffset(offsetForProgress(p, travel), travel)
    assert.ok(Math.abs(back - p) < 1e-9, `${p} did not round-trip`)
  }
})

test('focus index and focus offset agree, so the rail cannot disagree with itself', () => {
  const n = GEOM.n
  // The card the HUD lights must be the card the treatment calls "in focus".
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const i = indexForProgress(p, n)
    assert.ok(Math.abs(focusOffset(i, n, p)) < 0.55, `card ${i} at p=${p} was not the focus`)
    assert.ok(Math.abs(focusOffset(i, n, progressForIndex(i, n))) < 1e-9, `no exact focus for ${i}`)
  }
})

test('a scrub that overshoots cannot take the rail past either end', () => {
  const travel = 720
  assert.equal(offsetForProgress(-0.4, travel), 0)
  assert.equal(offsetForProgress(1.6, travel), travel)
  assert.equal(indexForProgress(-1, 5), 0)
  assert.equal(indexForProgress(2, 5), 4)
})

test('focusOffset is signed and saturates one card past its neighbour', () => {
  // At focus 0: card 1 is a step to the right, card -1 does not exist but must
  // not report an absurd magnitude either.
  assert.ok(focusOffset(1, 5, 0) > 0.9)
  assert.ok(focusOffset(4, 5, 0) <= 1.6, 'saturated at 1.6 so far cards do not fly off')
  assert.equal(focusOffset(0, 5, 0), 0)
  assert.ok(focusOffset(3, 5, 1) < 0, 'left of focus must be negative')
})

test('a single-card rail has no journey to take', () => {
  assert.equal(railTravel({ n: 1, cardW: 400, gap: 40, inset: 0, vpW: 1440 }), 0)
  assert.equal(progressForIndex(0, 1), 0)
  assert.equal(indexForProgress(0.7, 1), 0)
})

test('a two-card rail still splits the travel in half', () => {
  const travel = railTravel({ n: 2, cardW: 1000, gap: 40, inset: 0, vpW: 1440 })
  assert.equal(travel, 600)
  assert.equal(offsetForIndex(1, 2, travel), 600)
})

test('palette: endpoints match the authored stops', () => {
  assert.deepEqual(tintAt(0).a, STOPS[0].a)
  assert.deepEqual(tintAt(1).a, STOPS[STOPS.length - 1].a)
})

test('palette: every interpolated channel stays in gamut', () => {
  // Not a monotonicity claim about hue — just that interpolation cannot produce
  // out-of-range values, which would render as a clipped flash mid-scroll.
  for (let i = 0; i <= 100; i++) {
    const { a, b } = tintAt(i / 100)
    for (const c of [...a, ...b]) {
      assert.ok(c >= 0 && c <= 255, `channel ${c} out of range at p=${i / 100}`)
    }
  }
})

test('palette: tolerates progress outside 0..1 from an overshooting scrub', () => {
  assert.deepEqual(tintAt(-0.5).a, STOPS[0].a)
  assert.deepEqual(tintAt(1.5).a, STOPS[STOPS.length - 1].a)
})
