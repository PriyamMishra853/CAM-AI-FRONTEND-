import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { useData } from '../hooks/useSystemData'
import ClassroomFeed, { formatStamp } from './ClassroomFeed'
import DataSourceBadge from './ui/DataSourceBadge'
import { Stage } from './ui/primitives'

function Count({ value, p, range, decimals = 0, suffix = '' }) {
  const v = useTransform(p, range, [0, value ?? 0])
  const text = useTransform(v, (n) => (value == null ? '—' : `${n.toFixed(decimals)}${suffix}`))
  return <motion.span className="tabular-nums">{text}</motion.span>
}

export default function AttendanceResult() {
  const ref = useRef(null)
  const { data } = useData()
  const a = data?.attendance
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const reveal = useTransform(p, [0.14, 0.52], [0, 1])
  const veil = useTransform(p, [0, 0.12], [1, 0])
  const intro = useTransform(p, [0.04, 0.12, 0.3, 0.38], [0, 1, 1, 0])
  const panel = useTransform(p, [0.5, 0.6], [0, 1])
  const panelY = useTransform(p, [0.5, 0.6], [24, 0])

  const [recordedAt, setRecordedAt] = useState(null)
  useMotionValueEvent(p, 'change', (v) => {
    if (v > 0.72 && !recordedAt) setRecordedAt(a?.recordedAt ? new Date(a.recordedAt) : new Date())
    if (v < 0.6 && recordedAt) setRecordedAt(null)
  })

  const range = [0.52, 0.68]

  return (
    <Stage id="result" className="h-[300vh] max-md:h-[240vh]">
      <div ref={ref} className="absolute inset-0" />
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <ClassroomFeed className="h-full w-full" hud={false} reveal={reveal} camId={a?.cameraId ?? 'CAM-01'} room={a?.classId ?? 'CSE — 2A'} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/90 via-transparent to-void/40" />
        <motion.div style={{ opacity: veil }} className="grid-bg pointer-events-none absolute inset-0 bg-void" />

        <motion.div style={{ opacity: intro }} className="pointer-events-none absolute inset-x-5 top-[16%] md:inset-x-12 lg:inset-x-16">
          <p className="eyebrow mb-4 text-signal">09 · Result</p>
          <h2 className="display text-glow max-w-4xl text-[clamp(2.2rem,6.4vw,6rem)] text-ink">
            The same room.
            <br />
            <span className="text-signal">Now understood.</span>
          </h2>
        </motion.div>

        {/* results panel */}
        <motion.div
          style={{ opacity: panel, y: panelY }}
          className="glass brackets absolute right-4 bottom-14 left-4 p-5 md:right-auto md:bottom-16 md:left-12 md:w-[440px] md:p-7 lg:left-16"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[12px] tracking-[0.16em] text-ink">
              CLASS: <span className="text-signal">{a?.classId ?? '—'}</span>
            </p>
            <DataSourceBadge />
          </div>
          <dl className="mt-5 grid grid-cols-4 gap-3 border-t border-line pt-5 md:gap-4">
            {[
              ['Present', a?.present, 0, ''],
              ['Detected', a?.detected, 0, ''],
              ['Absent', a?.absent, 0, ''],
              ['Attendance', a?.attendancePct, 1, '%'],
            ].map(([k, v, d, s]) => (
              <div key={k} className={k === 'Attendance' ? 'col-span-4 sm:col-span-1' : ''}>
                <dt className="eyebrow text-[9px]">{k}</dt>
                <dd
                  className={`display-soft mt-1.5 text-[clamp(1.5rem,3vw,2.2rem)] ${
                    k === 'Absent' ? 'text-tally' : k === 'Attendance' ? 'text-signal' : 'text-ink'
                  }`}
                >
                  <Count value={v} p={p} range={range} decimals={d} suffix={s} />
                </dd>
              </div>
            ))}
          </dl>
          <div className="telemetry mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[10px]">
            <span className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-3 border border-signal" /> Identified
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-3 border border-dashed border-tally" /> Confirming across frames
            </span>
          </div>
        </motion.div>

        {/* confirmation */}
        <AnimatePresence>
          {recordedAt && (
            <motion.div
              key="stamp"
              initial={{ opacity: 0, scale: 1.25 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              role="status"
              className="absolute top-[18%] right-4 left-4 md:top-auto md:right-12 md:bottom-16 md:left-auto lg:right-28"
            >
              <div className="flex items-center gap-4 border border-signal bg-void/85 px-5 py-4 shadow-[0_0_60px_-10px_rgba(91,227,255,0.7)] backdrop-blur">
                <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0 text-signal" aria-hidden>
                  <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  <motion.path
                    d="m7 12.5 3.2 3.2L17 9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                </svg>
                <div>
                  <p className="display text-[clamp(1rem,2vw,1.4rem)] text-ink">Attendance recorded</p>
                  <p className="telemetry mt-1 text-[11px] text-signal">{formatStamp(recordedAt)}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Stage>
  )
}
