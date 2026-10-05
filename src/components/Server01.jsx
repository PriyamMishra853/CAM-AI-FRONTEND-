import { useRef, useState } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useTier } from '../lib/hooks'
import { ApiIcon, AttendanceIcon, DatabaseIcon, FolderIcon, NodeIcon, SchemaIcon } from './ui/Icons'
import { Stage } from './ui/primitives'

export const S01_MODULES = [
  { key: 'NODE.JS', role: 'Application server', Icon: NodeIcon, cursor: 'server' },
  { key: 'DATABASE', role: 'Student records', Icon: DatabaseIcon, cursor: 'database' },
  { key: 'ATTENDANCE', role: 'Attendance records', Icon: AttendanceIcon, cursor: 'database' },
  { key: 'SCHEMA', role: 'Structured data', Icon: SchemaIcon, cursor: 'database' },
  { key: 'FILE SYSTEM', role: 'Organized storage', Icon: FolderIcon, cursor: 'server' },
  { key: 'API', role: 'Data communication', Icon: ApiIcon, cursor: 'server' },
]

const FLOW = ['RTSP camera stream', 'Node.js server', 'Data processing', 'Database', 'Student records', 'Attendance records']

const SCHEMA = [
  ['student_id', 'string'],
  ['name', 'string'],
  ['class', 'string'],
  ['section', 'string'],
  ['timestamp', 'ISO-8601'],
  ['camera_id', 'string'],
  ['attendance_status', 'enum'],
]

// hexagonal orbit, percent coordinates inside a square
const ORBIT = [-90, -30, 30, 90, 150, 210].map((deg) => {
  const a = (deg * Math.PI) / 180
  return { x: 50 + Math.cos(a) * 37, y: 50 + Math.sin(a) * 37 }
})

function Orbit({ p, reduce }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[620px]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <circle cx="50" cy="50" r="37" fill="none" stroke="rgba(120,170,220,0.12)" strokeWidth="0.2" strokeDasharray="0.6 1.2" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(120,170,220,0.06)" strokeWidth="0.2" />
        {/* RTSP in */}
        <path id="s01-in" d="M 0 4 L 40 40" stroke="rgba(255,181,71,0.6)" strokeWidth="0.3" className="flow-line" fill="none" />
        {!reduce && (
          <circle r="0.9" fill="#ffb547">
            <animateMotion dur="1.6s" repeatCount="indefinite" path="M 0 4 L 40 40" />
          </circle>
        )}
        {ORBIT.map((o, i) => {
          const d = i % 2 ? `M 50 50 L ${o.x} ${o.y}` : `M ${o.x} ${o.y} L 50 50`
          return (
            <ModuleLine key={i} p={p} i={i} d={d} reduce={reduce} />
          )
        })}
      </svg>

      {/* core */}
      <div className="absolute top-1/2 left-1/2 w-[30%] -translate-x-1/2 -translate-y-1/2" data-cursor="server">
        <div className="relative aspect-square">
          <div className="absolute -inset-[18%] animate-spin-slow rounded-full border border-dashed border-signal/25" />
          <div className="absolute -inset-[8%] rounded-full bg-signal/10 blur-2xl" />
          <div className="glass glow-signal relative flex h-full w-full flex-col items-center justify-center">
            <span className="eyebrow text-[9px] text-signal">Server</span>
            <span className="display text-[clamp(1.8rem,4.5vw,3.4rem)] text-ink">01</span>
            <span className="telemetry mt-1 text-center text-[9px] leading-tight">MAIN APP ·<br />MEMORY LAYER</span>
          </div>
        </div>
      </div>

      {S01_MODULES.map((m, i) => (
        <Module key={m.key} m={m} pos={ORBIT[i]} p={p} i={i} />
      ))}

      <span className="telemetry absolute top-0 left-0 text-[10px] text-tally">RTSP IN</span>
    </div>
  )
}

const revealAt = (i) => 0.06 + i * 0.075

function ModuleLine({ p, i, d, reduce }) {
  const opacity = useTransform(p, [revealAt(i), revealAt(i) + 0.05], [0, 1])
  return (
    <motion.g style={{ opacity }}>
      <path d={d} stroke="rgba(91,227,255,0.35)" strokeWidth="0.25" fill="none" className="flow-line" />
      {!reduce && (
        <circle r="0.7" fill="#5be3ff">
          <animateMotion dur={`${1.4 + i * 0.2}s`} repeatCount="indefinite" path={d} />
        </circle>
      )}
    </motion.g>
  )
}

function Module({ m, pos, p, i }) {
  const opacity = useTransform(p, [revealAt(i), revealAt(i) + 0.05], [0, 1])
  const scale = useTransform(p, [revealAt(i), revealAt(i) + 0.05], [0.7, 1])
  const { Icon } = m
  return (
    <motion.div
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, opacity, scale }}
      className="absolute w-[26%] -translate-x-1/2 -translate-y-1/2"
      data-cursor={m.cursor}
    >
      <div className="glass flex flex-col items-center gap-1.5 px-2 py-3 text-center transition-colors duration-300 hover:border-signal/60 md:py-4">
        <Icon className="h-5 w-5 text-signal md:h-6 md:w-6" />
        <span className="font-mono text-[clamp(8px,1vw,11px)] font-semibold tracking-[0.14em] text-ink">{m.key}</span>
        <span className="hidden text-[11px] leading-tight text-mute sm:block">{m.role}</span>
      </div>
    </motion.div>
  )
}

export default function Server01() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const tier = useTier()
  const sticky = tier !== 'mobile'
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const full = useMotionValue(1)
  const p = sticky ? scrollYProgress : full

  const [step, setStep] = useState(sticky ? -1 : FLOW.length)
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (sticky) setStep(Math.floor((v - 0.05) / 0.1))
  })
  const schemaOpacity = useTransform(p, [0.62, 0.72], [0, 1])
  const schemaY = useTransform(p, [0.62, 0.72], [20, 0])

  return (
    <Stage id="server-01" className={sticky ? 'h-[300vh]' : 'py-28'}>
      <div ref={ref} className="absolute inset-0" />
      <div className={sticky ? 'sticky top-0 flex h-[100svh] items-center overflow-hidden' : 'relative'}>
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-10 px-5 md:px-12 lg:grid-cols-[0.85fr_1.15fr] lg:px-16 lg:pr-36">
          <div>
            <p className="eyebrow mb-5 flex items-center gap-3 text-signal/80">
              <span className="h-px w-8 bg-signal/50" />
              03 · Store
            </p>
            <h2 className="display text-[clamp(3rem,7.5vw,6.6rem)] text-ink">Server 01</h2>
            <p className="display-soft mt-4 text-[clamp(1.3rem,2.4vw,2rem)] text-signal">Capture. Store. Organize.</p>

            <ol className="mt-10 space-y-0" aria-label="Server 01 data flow">
              {FLOW.map((f, i) => {
                const done = i <= step
                const current = i === step
                return (
                  <li key={f} className="flex items-stretch gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-1.5 h-2 w-2 rotate-45 border transition-all duration-500 ${
                          current
                            ? 'border-signal bg-signal shadow-[0_0_12px_#5be3ff]'
                            : done
                              ? 'border-signal/70 bg-signal/30'
                              : 'border-ink/25'
                        }`}
                      />
                      {i < FLOW.length - 1 && (
                        <span className={`w-px flex-1 transition-colors duration-500 ${done ? 'bg-signal/50' : 'bg-line'}`} />
                      )}
                    </div>
                    <span
                      className={`pb-4 font-mono text-[13px] tracking-wide transition-colors duration-500 ${
                        current ? 'text-ink' : done ? 'text-ink/70' : 'text-mute/50'
                      }`}
                    >
                      {f}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>

          <div className="relative">
            <Orbit p={p} reduce={reduce} />
            <motion.div
              style={{ opacity: schemaOpacity, y: schemaY }}
              className="mt-4 flex flex-wrap justify-center gap-1.5 lg:absolute lg:inset-x-0 lg:-bottom-6 lg:mt-0"
            >
              {SCHEMA.map(([k, t]) => (
                <span key={k} className="border border-line bg-void/80 px-2 py-1 font-mono text-[10px] text-ink/80">
                  {k}
                  <span className="ml-1.5 text-mute">{t}</span>
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </Stage>
  )
}
