import { useReducedMotion } from 'framer-motion'
import { CameraIcon, ServerIcon } from './ui/Icons'
import { Reveal, Stage } from './ui/primitives'

const PATH = 'M 90 160 C 260 160, 300 80, 460 80 S 640 160, 790 160'

function Packet({ delay, kind }) {
  const color = kind === 'I' ? '#ffb547' : '#5be3ff'
  return (
    <g>
      <rect x="-13" y="-8" width="26" height="16" rx="2" fill="#04070d" stroke={color} strokeWidth="1.2" />
      <text x="0" y="3.5" textAnchor="middle" fontSize="9" fontFamily="IBM Plex Mono" fill={color}>
        {kind}
      </text>
      <animateMotion dur="3.6s" repeatCount="indefinite" begin={`${delay}s`} path={PATH} rotate="0" />
    </g>
  )
}

const FIELDS = [
  ['session', 'rtsp://<camera-host>/<stream>'],
  ['transport', 'RTP over TCP / UDP'],
  ['payload', 'H.264 video frames'],
  ['destination', 'Server 01 · ingest'],
]

export default function RTSPStream() {
  const reduce = useReducedMotion()
  const packets = 'IPPPPIPPPP'.split('')

  return (
    <Stage id="rtsp" className="overflow-hidden py-32 md:py-44">
      <div className="grid-bg grid-fade absolute inset-0 opacity-50" />
      <div className="relative mx-auto grid max-w-[1400px] items-center gap-16 px-5 md:px-12 lg:grid-cols-[0.8fr_1.2fr] lg:px-16 lg:pr-36">
        <div>
          <Reveal>
            <p className="eyebrow mb-5 flex items-center gap-3 text-signal/80">
              <span className="h-px w-8 bg-signal/50" />
              02 · Transport
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="display text-glow text-[clamp(5rem,14vw,11rem)] text-signal">RTSP</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="display-soft mt-4 text-[clamp(1.3rem,2.2vw,1.9rem)] text-ink">Real-Time Streaming Protocol</p>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-mute">
              Live camera streams are securely transmitted to the processing infrastructure.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="glass brackets relative p-5 md:p-8">
          <div className="mb-4 flex items-center justify-between">
            <span className="eyebrow text-[10px]">Stream · CAM-01 → S01</span>
            <span className="telemetry flex items-center gap-2 text-[10px] text-signal">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-signal" />
              STREAMING
            </span>
          </div>

          <svg viewBox="0 0 880 240" className="w-full" role="img" aria-label="Video packets travelling over RTSP from the camera to Server 01">
            <path d={PATH} fill="none" stroke="rgba(91,227,255,0.12)" strokeWidth="14" strokeLinecap="round" />
            <path d={PATH} fill="none" stroke="rgba(91,227,255,0.55)" strokeWidth="1.2" className="flow-line" />
            {!reduce && packets.map((k, i) => <Packet key={i} kind={k} delay={(i * 3.6) / packets.length} />)}

            <g data-cursor="camera">
              <rect x="10" y="115" width="80" height="90" rx="6" fill="#0a1222" stroke="rgba(91,227,255,0.5)" />
              <foreignObject x="30" y="135" width="40" height="40">
                <CameraIcon width={40} height={40} className="text-signal" />
              </foreignObject>
              <text x="50" y="193" textAnchor="middle" fontSize="10" fontFamily="IBM Plex Mono" fill="#8193ad">
                CAM-01
              </text>
            </g>
            <g data-cursor="server">
              <rect x="790" y="105" width="80" height="110" rx="6" fill="#0a1222" stroke="rgba(91,227,255,0.5)" />
              <foreignObject x="810" y="128" width="40" height="40">
                <ServerIcon width={40} height={40} className="text-signal" />
              </foreignObject>
              <text x="830" y="196" textAnchor="middle" fontSize="10" fontFamily="IBM Plex Mono" fill="#8193ad">
                SERVER 01
              </text>
            </g>
            <text x="460" y="58" textAnchor="middle" fontSize="10" fontFamily="IBM Plex Mono" letterSpacing="2" fill="#5be3ff">
              RTSP · RTP
            </text>
          </svg>

          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 border-y border-line py-3">
            <span className="telemetry flex items-center gap-2 text-[10px]">
              <span className="inline-block h-2.5 w-3 border border-tally" /> I · key frame
            </span>
            <span className="telemetry flex items-center gap-2 text-[10px]">
              <span className="inline-block h-2.5 w-3 border border-signal" /> P · delta frame
            </span>
          </div>

          <dl className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {FIELDS.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-b border-line/60 py-1.5 sm:block">
                <dt className="eyebrow text-[10px]">{k}</dt>
                <dd className="font-mono text-[12px] text-ink/85">{v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </Stage>
  )
}
