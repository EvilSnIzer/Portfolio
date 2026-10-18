import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark'|'light'>(() => {
    if (typeof window === 'undefined') return 'dark'
    return (localStorage.getItem('theme') as any) || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme==='light' ? '#f2f2f0' : '#0a0a0a')
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme)
  }, [theme])

  return (
    <button
      type="button"
      aria-label={`Switch to ${theme==='dark'?'light':'dark'} mode`}
      onClick={() => setTheme(t => t==='dark'?'light':'dark')}
      className="theme-toggle"
      title={`Theme: ${theme} — click to toggle`}
    >
      <i aria-hidden>{theme==='dark' ? '☾' : '☀'}</i>
    </button>
  )
}
