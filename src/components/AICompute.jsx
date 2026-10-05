import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useOnScreen } from '../lib/hooks'
import { Reveal, SectionHeading, Stage } from './ui/primitives'

const C = '#5be3ff'
const M = 'rgba(129,147,173,0.6)'
const heads = [
  [24, 30], [46, 28], [70, 30], [94, 29],
  [30, 52], [56, 51], [82, 52],
]

const Frame = ({ children }) => (
  <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden>
    <rect x="4" y="6" width="112" height="68" fill="none" stroke="rgba(120,170,220,0.25)" strokeWidth="0.8" />
    {children}
  </svg>
)

const VIZ = {
  frame: () => (
    <Frame>
      {heads.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill={M} />
          <rect x={x - 6} y={y + 5} width="12" height="8" rx="3" fill={M} opacity="0.6" />
        </g>
      ))}
    </Frame>
  ),
  detect: () => (
    <Frame>
      {heads.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill={M} />
          <rect x={x - 6} y={y + 5} width="12" height="8" rx="3" fill={M} opacity="0.6" />
          <rect x={x - 8} y={y - 6} width="16" height="21" fill="none" stroke={C} strokeWidth="0.8" />
        </g>
      ))}
    </Frame>
  ),
  face: () => (
    <Frame>
      <ellipse cx="38" cy="40" rx="16" ry="21" fill="none" stroke={C} strokeWidth="0.8" />
      {[[31, 35], [45, 35], [38, 43], [32, 50], [44, 50], [38, 52], [26, 42], [50, 42]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.1" fill={C} />
      ))}
      {Array.from({ length: 14 }, (_, i) => {
        const h = 6 + ((i * 53) % 34)
        return <rect key={i} x={66 + i * 3.4} y={58 - h} width="2" height={h} fill={C} opacity={0.35 + (i % 3) * 0.2} />
      })}
      <text x="66" y="68" fontSize="5.5" fontFamily="IBM Plex Mono" fill={M}>EMBEDDING</text>
    </Frame>
  ),
  track: () => (
    <Frame>
      {[
        ['M 14 60 Q 30 50 44 52', [44, 52], '#07'],
        ['M 40 22 Q 60 30 78 26', [78, 26], '#12'],
        ['M 106 64 Q 96 52 92 44', [92, 44], '#19'],
      ].map(([d, [x, y], id]) => (
        <g key={id}>
          <path d={d} fill="none" stroke={C} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
          <circle cx={x} cy={y} r="3" fill={C} />
          <text x={x + 5} y={y - 4} fontSize="6" fontFamily="IBM Plex Mono" fill={C}>{id}</text>
        </g>
      ))}
    </Frame>
  ),
  decide: () => (
    <Frame>
      <rect x="14" y="36" width="92" height="6" fill="rgba(120,170,220,0.15)" />
      <rect x="14" y="36" width={92 * 0.96} height="6" fill={C} opacity="0.75" />
      <line x1={14 + 92 * 0.8} x2={14 + 92 * 0.8} y1="28" y2="50" stroke="#ffb547" strokeWidth="0.8" />
      <text x={14 + 92 * 0.8} y="25" textAnchor="middle" fontSize="5.5" fontFamily="IBM Plex Mono" fill="#ffb547">THRESHOLD</text>
      <text x="14" y="62" fontSize="9" fontFamily="IBM Plex Mono" fill={C}>PRESENT</text>
      <text x="106" y="62" textAnchor="end" fontSize="7" fontFamily="IBM Plex Mono" fill={M}>0.96</text>
    </Frame>
  ),
  analytics: () => (
    <Frame>
      {[22, 34, 30, 46, 40, 54, 50, 58].map((h, i) => (
        <rect key={i} x={14 + i * 12} y={66 - h} width="7" height={h} fill={C} opacity={0.3 + i * 0.08} />
      ))}
    </Frame>
  ),
  pose: () => (
    <Frame>
      {[[40, 0], [80, 1]].map(([x, raised]) => (
        <g key={x} stroke={C} strokeWidth="1" fill="none" strokeLinecap="round">
          <circle cx={x} cy="22" r="4" />
          <path d={`M ${x} 26 V 46 M ${x} 46 L ${x - 7} 62 M ${x} 46 L ${x + 7} 62`} />
          <path d={raised ? `M ${x} 31 L ${x + 9} 22 L ${x + 10} 12 M ${x} 31 L ${x - 9} 39` : `M ${x} 31 L ${x - 9} 40 M ${x} 31 L ${x + 9} 40`} />
        </g>
      ))}
      <text x="112" y="12" textAnchor="end" fontSize="5.5" fontFamily="IBM Plex Mono" fill="#ffb547">HAND RAISED</text>
    </Frame>
  ),
  confidence: () => (
    <Frame>
      <path d="M 30 58 A 30 30 0 0 1 90 58" fill="none" stroke="rgba(120,170,220,0.2)" strokeWidth="5" />
      <path d="M 30 58 A 30 30 0 0 1 86 44" fill="none" stroke={C} strokeWidth="5" />
      <text x="60" y="56" textAnchor="middle" fontSize="11" fontFamily="IBM Plex Mono" fill={C}>0.94</text>
    </Frame>
  ),
}

const PIPELINE = [
  { id: 'frame', title: 'Camera frame', desc: 'A decoded frame from the stream.' },
  { id: 'detect', title: 'Person detection', desc: 'Finds every person in view.' },
  { id: 'face', title: 'Face / ID', desc: 'Matches faces to enrolled students.' },
  { id: 'track', title: 'Tracking', desc: 'Follows each person across frames.' },
  { id: 'decide', title: 'Attendance decision', desc: 'Marks present when evidence clears the threshold.' },
  { id: 'analytics', title: 'Analytics', desc: 'Rolls results up per class and session.' },
]

const AUX = [
  { id: 'pose', title: 'Pose / activity', desc: 'Reads posture and gestures.', col: 'lg:col-start-4', feeds: 'Tracking' },
  { id: 'confidence', title: 'Confidence scoring', desc: 'Weighs evidence over time.', col: 'lg:col-start-5', feeds: 'Attendance' },
]

function Card({ node, index, active, aux }) {
  const Viz = VIZ[node.id]
  return (
    <div
      data-cursor="gpu"
      className={`glass relative flex h-full flex-col p-4 transition-all duration-500 ${
        active ? 'border-signal/70 shadow-[0_0_36px_-8px_rgba(91,227,255,0.6)]' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`font-mono text-[10px] tracking-[0.18em] ${active ? 'text-signal' : 'text-mute'}`}>
          {aux ? 'AUX' : `STAGE ${index + 1}`}
        </span>
        <span className={`h-1.5 w-1.5 rounded-full transition-colors ${active ? 'bg-signal shadow-[0_0_8px_#5be3ff]' : 'bg-ink/20'}`} />
      </div>
      <div className="my-3 aspect-[3/2]">
        <Viz />
      </div>
      <h3 className="font-mono text-[12px] font-semibold tracking-[0.12em] text-ink uppercase">{node.title}</h3>
      <p className="mt-1 text-[13px] leading-snug text-mute">{node.desc}</p>
      {aux && <p className="telemetry mt-2 text-[10px] text-signal/70">↑ informs {node.feeds}</p>}
    </div>
  )
}

export default function AICompute() {
  const reduce = useReducedMotion()
  const [ref, onScreen] = useOnScreen('0px')
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (reduce || !onScreen) return
    const id = setInterval(() => setActive((a) => (a + 1) % PIPELINE.length), 1100)
    return () => clearInterval(id)
  }, [reduce, onScreen])

  return (
    <Stage id="ai-compute" className="overflow-hidden py-32 md:py-40">
      <div className="grid-bg grid-fade absolute inset-0 opacity-40" />
      <div ref={ref} className="relative mx-auto max-w-[1400px] px-5 md:px-12 lg:px-16 lg:pr-36">
        <SectionHeading
          eyebrow="06 · Inference pipeline"
          title={
            <>
              Inside <span className="text-signal">Server 02</span>
            </>
          }
          sub="Each frame passes through a chain of vision models. Every stage hands the next a richer description of the room."
        />

        <div className="mt-16 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:gap-5">
          {PIPELINE.map((n, i) => (
            <Reveal key={n.id} delay={i * 0.06} className="relative">
              <Card node={n} index={i} active={reduce || i === active} />
              {i < PIPELINE.length - 1 && (
                <svg className="absolute top-1/2 -right-5 hidden h-3 w-5 -translate-y-1/2 lg:block" viewBox="0 0 20 12" aria-hidden>
                  <path d="M0 6 H18" stroke={i < active ? C : 'rgba(120,170,220,0.4)'} strokeWidth="1" className="flow-line" />
                  <path d="M14 2 L19 6 L14 10" fill="none" stroke={C} strokeWidth="1" />
                </svg>
              )}
            </Reveal>
          ))}
          {AUX.map((n, i) => (
            <Reveal key={n.id} delay={0.4 + i * 0.08} className={`relative ${n.col}`}>
              <Card node={n} aux active={reduce || active === 3 + i} />
            </Reveal>
          ))}
        </div>

        <div className="telemetry mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-5 text-[11px]">
          <span>FRAME 000142</span>
          <span className="text-signal">→ {PIPELINE[active].title.toUpperCase()}</span>
          <span className="ml-auto">Visualization · models and thresholds are configured on Server 02</span>
        </div>
      </div>
    </Stage>
  )
}
