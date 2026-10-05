import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

/* ── Stage registry: lets the viewfinder HUD know where the reader is. ── */

export const StageContext = createContext({ active: 'classroom', setActive: () => {} })

export function StageProvider({ children }) {
  const [active, setActive] = useState('classroom')
  return <StageContext.Provider value={{ active, setActive }}>{children}</StageContext.Provider>
}

export const useStage = () => useContext(StageContext)

/** A story section. Marks itself active when its middle crosses the viewport. */
export function Stage({ id, cursor, className = '', children, ...rest }) {
  const ref = useRef(null)
  const { setActive } = useStage()
  const inView = useInView(ref, { margin: '-50% 0px -50% 0px' })
  useEffect(() => {
    if (inView) setActive(id)
  }, [inView, id, setActive])
  return (
    <section id={id} ref={ref} data-cursor={cursor} className={`relative ${className}`} {...rest}>
      {children}
    </section>
  )
}

/* ── Fade-up reveal on entering view. ── */

export function Reveal({ children, delay = 0, y = 24, className = '', as = 'div' }) {
  const reduce = useReducedMotion()
  const M = motion[as]
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </M>
  )
}

/* ── Magnetic hover: pulls gently toward the pointer. ── */

export function useMagnetic(strength = 0.28) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (!el || reduce || !window.matchMedia('(pointer: fine)').matches) return
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - (r.left + r.width / 2)) * strength
      const y = (e.clientY - (r.top + r.height / 2)) * strength
      el.style.transform = `translate(${x}px, ${y}px)`
    }
    const leave = () => {
      el.style.transform = ''
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [strength, reduce])
  return ref
}

export function PrimaryButton({ children, onClick, className = '', type = 'button', ...rest }) {
  const ref = useMagnetic()
  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      data-magnetic
      className={`group relative inline-flex items-center gap-3 border border-signal/60 bg-signal/10 px-7 py-4 font-mono text-[13px] font-medium tracking-[0.22em] text-signal uppercase transition-all duration-300 ease-out hover:bg-signal hover:text-void hover:shadow-[0_0_40px_-6px_rgba(91,227,255,0.7)] ${className}`}
      {...rest}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-tally shadow-[0_0_10px_#ffb547]" />
      {children}
    </button>
  )
}

/* ── Section heading: telemetry eyebrow + wide display title. ── */

export function SectionHeading({ eyebrow, title, sub, align = 'left', className = '' }) {
  return (
    <div className={`${align === 'center' ? 'mx-auto text-center' : ''} ${className}`}>
      {eyebrow && (
        <Reveal>
          <p className="eyebrow mb-5 flex items-center gap-3 text-signal/80 [&>span]:h-px [&>span]:w-8 [&>span]:bg-signal/50">
            {align !== 'center' && <span />}
            {eyebrow}
          </p>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2 className="display text-[clamp(2.2rem,5.4vw,5rem)] text-ink">{title}</h2>
      </Reveal>
      {sub && (
        <Reveal delay={0.12}>
          <p
            className={`mt-6 max-w-xl text-[clamp(1rem,1.4vw,1.2rem)] leading-relaxed text-mute ${align === 'center' ? 'mx-auto' : ''}`}
          >
            {sub}
          </p>
        </Reveal>
      )}
    </div>
  )
}

/** Status dot used across dashboard and architecture. */
export function StatusDot({ state = 'online', className = '' }) {
  const warn = state === 'offline' || state === 'error' || state === 'degraded'
  const color = warn ? 'bg-tally' : 'bg-signal'
  return (
    <span className={`relative inline-flex h-2 w-2 ${className}`}>
      <span className={`absolute inset-0 animate-pulse-ring rounded-full ${color}`} />
      <span className={`relative h-2 w-2 rounded-full ${color}`} />
    </span>
  )
}
