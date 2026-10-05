import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { CameraIcon, DatabaseIcon, GpuIcon, ServerIcon } from './ui/Icons'

const ICONS = { camera: CameraIcon, server: ServerIcon, database: DatabaseIcon, gpu: GpuIcon }
const INTERACTIVE = 'a, button, [role="button"], label, select, summary, [data-cursor="pointer"]'

/**
 * Small glowing dot with a trailing ring. Over elements tagged
 * `data-cursor="camera|server|database|gpu"` the ring becomes an icon chip.
 * Only mounts on fine pointers; touch devices keep their native behaviour.
 */
export default function CustomCursor() {
  const dot = useRef(null)
  const ring = useRef(null)
  const reduce = useReducedMotion()
  const [enabled, setEnabled] = useState(false)
  const [mode, setMode] = useState('default')
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    const mql = window.matchMedia('(pointer: fine)')
    const update = () => setEnabled(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('custom-cursor')
    const target = { x: -100, y: -100 }
    const pos = { x: -100, y: -100 }
    let raf

    const onMove = (e) => {
      target.x = e.clientX
      target.y = e.clientY
      if (dot.current) dot.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      setHidden(false)
    }
    const onOver = (e) => {
      const el = e.target instanceof Element ? e.target : null
      if (!el) return
      if (el.closest('input, textarea')) return setMode('text')
      const tagged = el.closest('[data-cursor]')?.dataset.cursor
      if (tagged && ICONS[tagged]) return setMode(tagged)
      if (el.closest(INTERACTIVE)) return setMode('pointer')
      setMode('default')
    }
    const onLeave = () => setHidden(true)
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const k = reduce ? 1 : 0.2
      pos.x += (target.x - pos.x) * k
      pos.y += (target.y - pos.y) * k
      if (ring.current) ring.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
    }
    raf = requestAnimationFrame(loop)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerleave', onLeave)
      document.documentElement.classList.remove('custom-cursor')
    }
  }, [enabled, reduce])

  if (!enabled) return null
  const Icon = ICONS[mode]
  const ringSize = Icon ? 40 : mode === 'pointer' ? 40 : 26

  return (
    <div aria-hidden className={`pointer-events-none fixed inset-0 z-[100] transition-opacity duration-200 ${hidden || mode === 'text' ? 'opacity-0' : 'opacity-100'}`}>
      <div ref={ring} className="absolute top-0 left-0 will-change-transform">
        <div
          className={`flex -translate-x-1/2 -translate-y-1/2 items-center justify-center border transition-all duration-300 ease-out ${
            Icon
              ? 'rounded-lg border-signal/70 bg-void/70 text-signal shadow-[0_0_24px_-4px_rgba(91,227,255,0.6)] backdrop-blur-sm'
              : mode === 'pointer'
                ? 'rounded-full border-signal/80 bg-signal/5'
                : 'rounded-full border-signal/35'
          }`}
          style={{ width: ringSize, height: ringSize }}
        >
          {Icon && <Icon width={18} height={18} />}
        </div>
      </div>
      <div ref={dot} className="absolute top-0 left-0 will-change-transform">
        <div
          className={`-translate-x-1/2 -translate-y-1/2 rounded-full bg-signal shadow-[0_0_12px_2px_rgba(91,227,255,0.8)] transition-[width,height,opacity] duration-200 ${
            Icon ? 'h-0 w-0 opacity-0' : 'h-1.5 w-1.5'
          }`}
        />
      </div>
    </div>
  )
}
