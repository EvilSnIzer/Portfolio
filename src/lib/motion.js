/**
 * Shared motion helpers. Everything DOM-side funnels through these two hooks so
 * that (a) reduced-motion users get a plain readable page and (b) there is one
 * definition of what "reveal" looks like on this site.
 */
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { scroll } from '../state/scroll'
import { getQuality } from '../state/quality'

gsap.registerPlugin(ScrollTrigger, SplitText)

/**
 * Writes this section's traversal progress into `scroll.section[id]` — the only
 * place section progress is computed. Shaders/camera read it in useFrame.
 *
 * @returns {React.RefObject} attach to the <section> element
 */
export function useSectionProgress(id, { end = '65% 50%', start = '0% 100%' } = {}) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.id = el.id || id
    const st = ScrollTrigger.create({
      trigger: el,
      start,
      end,
      onUpdate: (self) => {
        scroll.section[id] = self.progress
      },
    })
    const set = (v) => (scroll.section[id] = v)
    set(0)
    return () => {
      st.kill()
      set(0)
    }
  }, [id, start, end])
  return ref
}

/** Marks `data-in` on elements that have entered once — used for nav + camera. */
export function useActiveSection(id) {
  const [active, setActive] = useState(false)
  useEffect(() => {
    const el = document.getElementById(id)
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          scroll.active = id
          setActive(true)
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [id])
  return active
}

/**
 * Entrance reveal. Children tagged `data-reveal` animate in with a stagger;
 * elements tagged `data-split` animate word-by-word with a mask.
 *
 * Reduced motion: opacity only, no transforms, no ScrollTrigger at all.
 */
export function useReveal(scope, { threshold = 0.22, stagger = 0.075, base = 'bottom' } = {}) {
  const inner = useRef(null)

  useEffect(() => {
    // With no scope the hook observes its own `inner` ref (attach it to a wrapper);
    // with one, it observes that element and keeps `inner` unset.
    const el = (scope ? (typeof scope === 'function' ? scope() : scope?.current ?? scope) : inner.current)
    if (!el) return
    if (!el) return

    const targets = el.querySelectorAll('[data-reveal]')
    if (!targets.length) return
    const reduced = getQuality().reduced

    if (reduced) {
      gsap.set(targets, { opacity: 1, y: 0 })
      return
    }

    gsap.set(targets, { opacity: 0, y: base === 'bottom' ? 28 : 0, x: base === 'left' ? -36 : 0 })

    const anim = () =>
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        x: 0,
        duration: 1.05,
        ease: 'expo.out',
        stagger,
        overwrite: 'auto',
      })

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            anim()
            io.disconnect()
          }
        })
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [scope, threshold, stagger, base])

  return inner
}

/**
 * Big-type treatment: split into words, each rising out of an overflow-hidden
 * mask. Runs after the preloader hands over (pass `play` when ready).
 */
export function useSplitWords(el, { play = true, delay = 0 } = {}) {
  useEffect(() => {
    const node = el?.current ?? el
    if (!node || !play) return
    if (getQuality().reduced) {
      gsap.set(node, { opacity: 1 })
      return
    }
    const split = new SplitText(node, {
      type: 'words,lines',
      wordsClass: 'inline-block',
      linesClass: 'relative block overflow-hidden pb-[0.06em]',
    })
    gsap.from(split.words, {
      yPercent: 118,
      opacity: 0,
      rotate: 1.5,
      duration: 1.15,
      ease: 'expo.out',
      stagger: 0.055,
      delay,
    })
    return () => split.revert()
  }, [el, play, delay])
}

/** Count a numeric string up when it scrolls in (project metrics, timeline years). */
export function useCountUp(el, { play = true } = {}) {
  useEffect(() => {
    const node = el?.current ?? el
    if (!node || !play || getQuality().reduced) return
    const from = node.textContent.trim()
    const m = from.match(/^([^\d]*)([\d,.]+)(.*)$/)
    if (!m) return
    const [, prefix, digits, suffix] = m
    const target = parseFloat(digits.replace(/,/g, ''))
    const dec = digits.includes('.') ? digits.split('.')[1].length : 0
    const obj = { v: 0 }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        io.disconnect()
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'power3.out',
          onUpdate: () => {
            const val = obj.v.toLocaleString('en-US', {
              minimumFractionDigits: dec,
              maximumFractionDigits: dec,
            })
            node.textContent = `${prefix}${val}${suffix}`
          },
          onComplete: () => (node.textContent = from),
        })
      },
      { threshold: 0.6 }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [el, play])
}

export { gsap, ScrollTrigger }
