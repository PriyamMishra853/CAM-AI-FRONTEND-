import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { isBackendConfigured } from '../config/api'
import { useTier } from '../lib/hooks'
import { scrollToStage } from '../lib/stages'
import { BrainIcon, CameraIcon, DashboardIcon, GpuIcon, ServerIcon } from './ui/Icons'
import { PrimaryButton, Reveal, Stage } from './ui/primitives'

const NODES = [
  {
    id: 'camera',
    title: 'Classroom camera',
    sub: 'Capture',
    Icon: CameraIcon,
    cursor: 'camera',
    role: 'Watches the room and publishes a live video stream.',
    input: 'Light from the classroom',
    output: 'RTSP video stream',
    stage: 'camera',
  },
  {
    id: 's01',
    title: 'Server 01',
    sub: 'Node.js · Application · Database',
    Icon: ServerIcon,
    cursor: 'server',
    role: 'Ingests streams, runs the application and keeps student, session and attendance records.',
    input: 'RTSP streams, dashboard requests',
    output: 'Frames for analysis, API responses',
    stage: 'server-01',
  },
  {
    id: 's02',
    title: 'Server 02',
    sub: 'AI engine',
    Icon: BrainIcon,
    cursor: 'server',
    role: 'Runs the vision pipeline: detection, identification, tracking and the attendance decision.',
    input: 'Frames over a secure SSH channel',
    output: 'Inference jobs, decisions',
    stage: 'server-02',
  },
  {
    id: 'dgx',
    title: 'NVIDIA DGX A100',
    sub: 'GPU computation',
    Icon: GpuIcon,
    cursor: 'gpu',
    role: 'Provides the GPU compute that the vision models run on.',
    input: 'Inference jobs',
    output: 'Model outputs',
    stage: 'dgx',
  },
  {
    id: 'inference',
    title: 'AI inference',
    sub: 'Detection · Tracking · Attendance',
    Icon: BrainIcon,
    cursor: 'gpu',
    role: 'Turns model outputs into who is present, with a confidence for each person.',
    input: 'Model outputs',
    output: 'Attendance records, room analytics',
    stage: 'result',
  },
  {
    id: 'dashboard',
    title: 'CAM AI dashboard',
    sub: 'Control room',
    Icon: DashboardIcon,
    cursor: 'pointer',
    role: 'Shows administrators live feeds, attendance and system health.',
    input: 'Server 01 API',
    output: 'Decisions by people',
    stage: 'dashboard',
  },
]
const EDGES = ['RTSP', 'Secure data / SSH', 'Dispatch', 'Results', 'API']

function Connector({ label, i, vertical, reduce }) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center ${vertical ? 'h-14 w-full' : 'h-auto w-10 xl:w-16'}`}
      aria-hidden
    >
      <div className={`absolute bg-signal/25 ${vertical ? 'inset-y-0 left-1/2 w-px' : 'inset-x-0 top-1/2 h-px'}`} />
      {!reduce && (
        <span
          className="absolute h-1.5 w-1.5 rounded-full bg-signal shadow-[0_0_10px_#5be3ff]"
          style={{
            animation: `${vertical ? 'flowY' : 'flowX'} 3s ${i * 0.5}s linear infinite`,
            ...(vertical ? { left: 'calc(50% - 3px)' } : { top: 'calc(50% - 3px)' }),
          }}
        />
      )}
      <span
        className={`telemetry absolute bg-void px-1.5 text-[9px] whitespace-nowrap text-signal/80 ${
          vertical ? 'left-[calc(50%+10px)]' : '-top-0.5 -translate-y-full'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

function NodeTile({ node, selected, dimmed, onSelect, vertical }) {
  const { Icon } = node
  return (
    <div className={`group relative ${vertical ? 'w-full' : 'min-w-0 flex-1'}`}>
      <motion.button
        type="button"
        data-cursor={node.cursor}
        onClick={onSelect}
        aria-expanded={selected}
        aria-describedby={`tip-${node.id}`}
        animate={{ scale: selected ? 1.08 : 1, opacity: dimmed ? 0.35 : 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`glass flex w-full items-center px-3 py-5 transition-colors duration-300 hover:border-signal/60 ${
          selected ? 'brackets glow-signal border-signal/70' : ''
        } ${vertical ? 'flex-row gap-4 px-5 text-left' : 'flex-col gap-2 text-center'}`}
      >
        <Icon className="h-6 w-6 shrink-0 text-signal" />
        <span className="flex flex-col">
          <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-ink uppercase">{node.title}</span>
          <span className="mt-1 text-[11px] leading-tight text-mute">{node.sub}</span>
        </span>
      </motion.button>
      {!vertical && (
        <span
          id={`tip-${node.id}`}
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+14px)] left-1/2 z-10 w-56 -translate-x-1/2 translate-y-1 border border-signal/40 bg-void/95 p-3 text-[12px] leading-snug text-ink/90 opacity-0 shadow-xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
        >
          {node.role}
        </span>
      )}
    </div>
  )
}

function Detail({ node, onClose }) {
  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.35 }}
      className="glass brackets mt-4 grid gap-5 p-5 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center md:p-6"
    >
      <div>
        <p className="eyebrow text-[10px] text-signal">{node.sub}</p>
        <p className="display-soft mt-1 text-xl text-ink">{node.title}</p>
        <p className="mt-2 text-[14px] leading-snug text-mute">{node.role}</p>
      </div>
      <div>
        <p className="eyebrow text-[9px]">Receives</p>
        <p className="mt-1 font-mono text-[12px] text-ink/85">{node.input}</p>
      </div>
      <div>
        <p className="eyebrow text-[9px]">Sends</p>
        <p className="mt-1 font-mono text-[12px] text-ink/85">{node.output}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => scrollToStage(node.stage)}
          className="border border-signal/60 px-3 py-2 font-mono text-[10px] tracking-[0.16em] text-signal uppercase hover:bg-signal hover:text-void"
        >
          Revisit stage
        </button>
        <button
          type="button"
          onClick={onClose}
          className="border border-line px-3 py-2 font-mono text-[10px] tracking-[0.16em] text-mute uppercase hover:text-ink"
        >
          Close
        </button>
      </div>
    </motion.div>
  )
}

export default function Architecture() {
  const reduce = useReducedMotion()
  const vertical = useTier() === 'mobile'
  const [selected, setSelected] = useState(null)
  const node = NODES.find((n) => n.id === selected)

  useEffect(() => {
    if (!selected) return
    const onKey = (e) => e.key === 'Escape' && setSelected(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  const enterCamAI = () => {
    scrollToStage('classroom')
    setTimeout(() => document.getElementById('login-id')?.focus({ preventScroll: true }), reduce ? 0 : 900)
  }

  return (
    <Stage id="architecture" className="overflow-hidden pt-32 pb-24 md:pt-40">
      <style>{`
        @keyframes flowX { from{left:0;opacity:0} 10%{opacity:1} 90%{opacity:1} to{left:100%;opacity:0} }
        @keyframes flowY { from{top:0;opacity:0} 10%{opacity:1} 90%{opacity:1} to{top:100%;opacity:0} }
      `}</style>
      <div className="grid-bg grid-fade absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-[1400px] px-5 md:px-12 lg:px-16 lg:pr-36">
        <Reveal>
          <p className="eyebrow mb-5 flex items-center gap-3 text-signal/80">
            <span className="h-px w-8 bg-signal/50" />
            11 · Architecture
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="display text-[clamp(2.2rem,5.4vw,5rem)] text-ink">
            From camera
            <br />
            to <span className="text-signal">intelligence</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-xl text-lg text-mute">
            {vertical ? 'Tap' : 'Hover or select'} any component to see what it does and where it sits in the path.
          </p>
        </Reveal>

        <Reveal delay={0.15} className="mt-20">
          <div className={vertical ? 'flex flex-col' : 'flex items-stretch'}>
            {NODES.map((n, i) => (
              <div key={n.id} className="contents">
                <NodeTile
                  node={n}
                  vertical={vertical}
                  selected={selected === n.id}
                  dimmed={selected && selected !== n.id}
                  onSelect={() => setSelected((s) => (s === n.id ? null : n.id))}
                />
                {vertical && (
                  <AnimatePresence>{selected === n.id && <Detail node={n} onClose={() => setSelected(null)} />}</AnimatePresence>
                )}
                {i < NODES.length - 1 && <Connector label={EDGES[i]} i={i} vertical={vertical} reduce={reduce} />}
              </div>
            ))}
          </div>
          {!vertical && <AnimatePresence mode="wait">{node && <Detail node={node} onClose={() => setSelected(null)} />}</AnimatePresence>}
        </Reveal>

        {/* closing */}
        <div className="mt-40 border-t border-line pt-24 text-center md:mt-48">
          <Reveal>
            <p className="eyebrow mb-6 text-signal">Capture. Compute. Understand.</p>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="display text-glow mx-auto max-w-6xl text-[clamp(2.2rem,6vw,5.6rem)] text-ink">
              From camera
              <br />
              to intelligence.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-mute">
              CAM AI turns ordinary classroom cameras into an intelligent attendance and classroom analytics system.
            </p>
          </Reveal>
          <Reveal delay={0.15} className="mt-12 flex justify-center">
            <PrimaryButton onClick={enterCamAI}>Enter CAM AI</PrimaryButton>
          </Reveal>
        </div>

        <footer className="telemetry mt-32 flex flex-col gap-2 border-t border-line pt-6 text-[10px] md:flex-row md:justify-between">
          <span>CAM AI · Camera intelligence for automated attendance &amp; classroom analytics</span>
          <span>
            {isBackendConfigured ? 'Connected to Server 01 API' : 'Figures shown are demo data until Server 01 is connected'}
          </span>
        </footer>
      </div>
    </Stage>
  )
}
