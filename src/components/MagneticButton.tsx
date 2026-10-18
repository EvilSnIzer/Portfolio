import { useRef } from 'react'

export function MagneticButton({ children, className='', href, onClick, ...rest }: any) {
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null)
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - (r.left + r.width/2)) * 0.35
    const y = (e.clientY - (r.top + r.height/2)) * 0.35
    el.style.transform = `translate3d(${x}px,${y}px,0)`
  }
  const onLeave = () => { if (ref.current) ref.current.style.transform = 'translate3d(0,0,0)' }
  const Comp: any = href ? 'a' : 'button'
  return (
    <span className="magnetic-wrap" onMouseMove={onMove} onMouseLeave={onLeave}>
      <Comp ref={ref} href={href} onClick={onClick} className={className} {...rest}>{children}</Comp>
    </span>
  )
}
