import { useEffect, useState } from 'react'
import { getQuality, subscribeQuality } from '../state/quality'

export function useQuality() {
  const [q, setQ] = useState(getQuality)
  useEffect(() => subscribeQuality(setQ), [])
  return q
}

export function useMedia(query) {
  const [on, setOn] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches
  )
  useEffect(() => {
    const m = window.matchMedia(query)
    const fn = () => setOn(m.matches)
    m.addEventListener('change', fn)
    return () => m.removeEventListener('change', fn)
  }, [query])
  return on
}

export function useReducedMotion() {
  return useMedia('(prefers-reduced-motion: reduce)')
}
