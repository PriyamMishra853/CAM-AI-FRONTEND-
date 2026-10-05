import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { isBackendConfigured } from '../config/api'
import { useData } from '../hooks/useSystemData'
import { useOnScreen } from '../lib/hooks'
import ClassroomFeed from './ClassroomFeed'
import DataSourceBadge from './ui/DataSourceBadge'
import { CameraIcon, ChartIcon, DashboardIcon, GpuIcon, ServerIcon } from './ui/Icons'
import { Reveal, SectionHeading, Stage, StatusDot } from './ui/primitives'

const SEEDS = { 'CAM-01': 7, 'CAM-02': 19, 'CAM-03': 31 }

function Panel({ title, icon: Icon, right, className = '', children }) {
  return (
    <div className={`border border-line bg-abyss/70 p-4 md:p-5 ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-signal" />}
        <h3 className="eyebrow text-[10px] text-ink/80">{title}</h3>
        <span className="ml-auto">{right}</span>
      </div>
      {children}
    </div>
  )
}

function Gauge({ pct }) {
  const r = 34
  const c = 2 * Math.PI * r
  const v = pct == null ? 0 : Math.min(100, pct) / 100
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90" aria-hidden>
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(120,170,220,0.15)" strokeWidth="5" />
      <motion.circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke="#5be3ff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        whileInView={{ strokeDashoffset: c * (1 - v) }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  )
}

function Sparkline({ values }) {
  if (!values?.length) return <p className="text-[13px] text-mute">No readings yet today.</p>
  const min = Math.min(...values) - 2
  const max = Math.max(...values) + 1
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 200, 60 - ((v - min) / (max - min)) * 56])
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg viewBox="-4 -4 212 70" className="h-20 w-full overflow-visible" role="img" aria-label="Attendance percentage through the day">
      <path d={`${d} L200 64 L0 64 Z`} fill="rgba(91,227,255,0.08)" />
      <motion.path
        d={d}
        fill="none"
        stroke="#5be3ff"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6 }}
      />
      <circle cx={lx} cy={ly} r="3" fill="#5be3ff" />
    </svg>
  )
}

const DEMO_EVENTS = [
  'S02 → S01 · detection batch received',
  'S01 · attendance committed · CSE — 2A',
  'DGX · inference job complete',
  'S01 → S02 · frame batch dispatched over SSH',
  'S01 · session window open · CSE — 2B',
  'S02 · tracking confirmed 2 students',
]

/** Demo-only event ticker. Live mode waits for a Server 01 event stream. */
function EventFeed({ demo, running }) {
  const reduce = useReducedMotion()
  const [events, setEvents] = useState(() => DEMO_EVENTS.slice(0, 4).map((t, i) => ({ id: i, t })))
  useEffect(() => {
    if (!demo || !running || reduce) return
    let n = 4
    const id = setInterval(() => {
      setEvents((e) => [{ id: n, t: DEMO_EVENTS[n % DEMO_EVENTS.length] }, ...e].slice(0, 4))
      n++
    }, 2200)
    return () => clearInterval(id)
  }, [demo, running, reduce])

  if (!demo) {
    return (
      <p className="text-[13px] leading-snug text-mute">
        Waiting for events. Set <code className="font-mono text-ink/80">VITE_SERVER01_WS_URL</code> to stream pipeline events here.
      </p>
    )
  }
  return (
    <ul className="space-y-2 overflow-hidden" aria-live="off">
      <AnimatePresence initial={false}>
        {events.map((e) => (
          <motion.li
            key={e.id}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3 font-mono text-[11px] text-ink/75"
          >
            <span className="text-signal/70">›</span>
            <span className="truncate">{e.t}</span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

const stateLabel = (s) => (s ? s.toUpperCase() : '—')

export default function AdminDashboard() {
  const { data, source } = useData()
  const [ref, onScreen] = useOnScreen('0px')
  const cameras = data?.cameras ?? []
  const a = data?.attendance
  const sys = data?.system
  const [camId, setCamId] = useState('CAM-01')
  const cam = cameras.find((c) => c.id === camId) ?? cameras[0]

  const engine = [
    ['Server 01', sys?.server01, ServerIcon],
    ['Server 02', sys?.server02, ServerIcon],
    ['DGX A100', sys?.dgx, GpuIcon],
  ]

  return (
    <Stage id="dashboard" className="overflow-hidden py-32 md:py-40">
      <div className="relative mx-auto max-w-[1400px] px-5 md:px-12 lg:px-16 lg:pr-36">
        <SectionHeading
          eyebrow="10 · Control room"
          title={
            <>
              The CAM AI
              <br />
              <span className="text-signal">dashboard</span>
            </>
          }
          sub="Everything above, condensed into one screen for administrators: live feeds, today’s attendance and the health of every server in the path."
        />

        {/* feed from the infrastructure into the dashboard */}
        <div className="mt-14 flex items-center gap-3" aria-hidden>
          <span className="telemetry shrink-0 text-[10px]">SERVER 01 API</span>
          <svg className="h-2 flex-1" preserveAspectRatio="none" viewBox="0 0 100 2">
            <line x1="0" y1="1" x2="100" y2="1" stroke="#5be3ff" strokeWidth="1" vectorEffect="non-scaling-stroke" className="flow-line" />
          </svg>
          <span className="telemetry shrink-0 text-[10px] text-signal">DASHBOARD</span>
        </div>

        <Reveal className="mt-3">
          <div ref={ref} data-cursor="pointer" className="glass overflow-hidden shadow-[0_50px_140px_-50px_rgba(91,227,255,0.35)]">
            {/* app bar */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line px-4 py-3 md:px-6">
              <span className="flex items-center gap-2">
                <DashboardIcon className="h-4 w-4 text-signal" />
                <span className="font-display text-[13px] font-extrabold tracking-[0.12em] [font-stretch:125%]">CAM AI</span>
                <span className="telemetry text-[10px]">· CONTROL ROOM</span>
              </span>
              <span className="telemetry hidden gap-5 text-[10px] md:flex">
                <span className="text-ink">OVERVIEW</span>
                <span>CAMERAS</span>
                <span>ATTENDANCE</span>
                <span>REPORTS</span>
              </span>
              <DataSourceBadge className="ml-auto" />
            </div>

            <div className="grid gap-3 p-3 md:grid-cols-12 md:p-4">
              {/* live camera */}
              <Panel
                title="Live camera"
                icon={CameraIcon}
                className="md:col-span-7 md:row-span-2"
                right={
                  <div className="flex gap-1" role="tablist" aria-label="Choose camera">
                    {cameras.map((c) => (
                      <button
                        key={c.id}
                        role="tab"
                        aria-selected={c.id === cam?.id}
                        onClick={() => setCamId(c.id)}
                        className={`border px-2 py-0.5 font-mono text-[10px] tracking-wider transition-colors ${
                          c.id === cam?.id ? 'border-signal text-signal' : 'border-line text-mute hover:text-ink'
                        }`}
                      >
                        {c.id}
                      </button>
                    ))}
                  </div>
                }
              >
                {cam ? (
                  <ClassroomFeed
                    key={cam.id}
                    className="aspect-video w-full"
                    reveal={1}
                    seed={SEEDS[cam.id] ?? 7}
                    camId={cam.id}
                    room={cam.room}
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center border border-dashed border-line text-[13px] text-mute">
                    {source === 'error' ? 'Camera list unavailable — Server 01 unreachable.' : 'No cameras registered yet.'}
                  </div>
                )}
              </Panel>

              {/* cameras */}
              <Panel title="Live cameras" icon={CameraIcon} className="md:col-span-5">
                <ul className="space-y-2.5">
                  {cameras.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 font-mono text-[12px]">
                      <StatusDot state={c.status} />
                      <span className="text-ink">{c.name}</span>
                      <span className="text-mute">{c.room}</span>
                      <span className={`ml-auto tracking-wider ${c.status === 'online' ? 'text-signal' : 'text-tally'}`}>
                        {stateLabel(c.status)}
                      </span>
                    </li>
                  ))}
                  {!cameras.length && <li className="text-[13px] text-mute">No camera data.</li>}
                </ul>
              </Panel>

              {/* today */}
              <Panel title="Today" icon={ChartIcon} className="md:col-span-5" right={<span className="telemetry text-[10px]">{a?.classId}</span>}>
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <Gauge pct={a?.attendancePct} />
                    <span className="display-soft absolute inset-0 flex items-center justify-center text-lg text-signal">
                      {a?.attendancePct != null ? `${a.attendancePct}%` : '—'}
                    </span>
                  </div>
                  <dl className="grid flex-1 grid-cols-2 gap-3">
                    <div>
                      <dt className="eyebrow text-[9px]">Present</dt>
                      <dd className="display-soft mt-1 text-3xl text-ink">{a?.present ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow text-[9px]">Absent</dt>
                      <dd className="display-soft mt-1 text-3xl text-tally">{a?.absent ?? '—'}</dd>
                    </div>
                  </dl>
                </div>
              </Panel>

              {/* AI engine */}
              <Panel title="AI engine" icon={GpuIcon} className="md:col-span-4">
                <ul className="space-y-3">
                  {engine.map(([name, s, Icon]) => (
                    <li key={name} className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-mute" />
                      <div className="min-w-0">
                        <p className="font-mono text-[12px] text-ink">{name}</p>
                        <p className="truncate text-[11px] text-mute">{s?.detail ?? 'No status'}</p>
                      </div>
                      <span className="ml-auto flex items-center gap-2 font-mono text-[11px] tracking-wider text-signal">
                        <StatusDot state={s?.state} />
                        {stateLabel(s?.state)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title="Attendance through the day" icon={ChartIcon} className="md:col-span-4">
                <Sparkline values={data?.trend} />
              </Panel>

              <Panel title="Pipeline events" icon={ServerIcon} className="md:col-span-4">
                <EventFeed demo={!isBackendConfigured} running={onScreen} />
              </Panel>
            </div>
          </div>
        </Reveal>
      </div>
    </Stage>
  )
}
