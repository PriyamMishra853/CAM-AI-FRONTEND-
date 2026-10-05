import { useEffect, useRef } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { STAGES, scrollToStage } from '../lib/stages'
import { useStage } from './ui/primitives'

const pad = (n) => String(n).padStart(2, '0')

/** Running SMPTE-style timecode, written straight to the DOM (no re-renders). */
function Timecode() {
  const ref = useRef(null)
  useEffect(() => {
    let raf
    let last = -1
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const d = new Date()
      const f = Math.floor((d.getMilliseconds() / 1000) * 24)
      if (f === last) return
      last = f
      if (ref.current) ref.current.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}:${pad(f)}`
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <span ref={ref} className="tabular-nums">00:00:00:00</span>
}

function Corner({ className }) {
  return <span className={`absolute h-6 w-6 border-signal/45 ${className}`} />
}

/**
 * The persistent viewfinder. Everything the reader scrolls through is seen
 * "through the camera"; the rail on the right is the frame's signal path.
 */
export default function ViewfinderHUD() {
  const { active } = useStage()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const index = Math.max(0, STAGES.findIndex((s) => s.id === active))
  const current = STAGES[index]

  return (
    <div className="pointer-events-none fixed inset-0 z-40 select-none">
      {/* corners */}
      <div className="absolute inset-3 hidden md:block lg:inset-4">
        <Corner className="top-0 left-0 border-t border-l" />
        <Corner className="top-0 right-0 border-t border-r" />
        <Corner className="bottom-0 left-0 border-b border-l" />
        <Corner className="right-0 bottom-0 border-r border-b" />
      </div>

      {/* keeps the HUD legible over whatever scrolls beneath */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-void/90 to-transparent" />

      {/* top bar */}
      <div className="telemetry absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3 text-ink/80 md:px-8 md:py-5">
        <button
          type="button"
          onClick={() => scrollToStage('classroom')}
          className="pointer-events-auto flex items-center gap-2.5"
          aria-label="CAM AI — back to start"
        >
          <span className="h-2 w-2 animate-blink rounded-full bg-tally shadow-[0_0_10px_#ffb547]" />
          <span className="font-display text-[13px] font-extrabold tracking-[0.12em] text-ink [font-stretch:125%]">
            CAM AI
          </span>
        </button>
        <div className="flex items-center gap-4 md:gap-6">
          <span className="hidden text-mute sm:inline">
            {pad(index + 1)}/{pad(STAGES.length)} · {current.label.toUpperCase()}
          </span>
          <span className="text-signal/90">
            TC <Timecode />
          </span>
        </div>
      </div>

      {/* signal-path rail */}
      <nav
        aria-label="Story navigation"
        className="pointer-events-auto absolute top-1/2 right-5 hidden -translate-y-1/2 flex-col items-end gap-2.5 lg:flex xl:right-8"
      >
        {STAGES.map((s, i) => {
          const isActive = s.id === active
          const passed = i < index
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollToStage(s.id)}
              aria-current={isActive ? 'step' : undefined}
              className="group flex items-center gap-3 py-0.5"
            >
              <span
                className={`telemetry text-[10px] transition-all duration-300 ${
                  isActive ? 'text-signal opacity-100' : 'translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                }`}
              >
                {s.label.toUpperCase()}
              </span>
              <span
                className={`block h-px transition-all duration-500 ${
                  isActive ? 'w-8 bg-signal shadow-[0_0_8px_#5be3ff]' : passed ? 'w-4 bg-signal/50' : 'w-3 bg-ink/25 group-hover:bg-ink/60'
                }`}
              />
            </button>
          )
        })}
      </nav>

      {/* journey progress */}
      <div className="absolute inset-x-4 bottom-3 hidden items-center gap-4 md:flex lg:inset-x-8 lg:bottom-5">
        <span className="telemetry shrink-0 text-[10px]">SIGNAL PATH</span>
        <div className="relative h-px flex-1 bg-line">
          <motion.div className="absolute inset-y-0 left-0 w-full origin-left bg-signal/70" style={{ scaleX: progress }} />
        </div>
        <span className="telemetry shrink-0 text-[10px]">CAMERA → INTELLIGENCE</span>
      </div>
    </div>
  )
}
