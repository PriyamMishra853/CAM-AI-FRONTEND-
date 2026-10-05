import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { mulberry32 } from '../lib/hooks'
import ClassroomFeed from './ClassroomFeed'
import { Stage } from './ui/primitives'

const APERTURE = 57.1 // aperture radius inside the lens viewBox (−100…100)
const ring = (r) => `M ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`

function useViewport() {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return vp
}

/** The lens housing drawn around the live feed. The aperture is left open. */
function LensRings({ knurl }) {
  const ticks = useMemo(() => Array.from({ length: 120 }, (_, i) => (i * 360) / 120), [])
  const leds = useMemo(() => Array.from({ length: 12 }, (_, i) => (i * 360) / 12 + 15), [])
  return (
    <svg viewBox="-100 -100 200 200" className="h-full w-full overflow-visible" aria-hidden>
      <defs>
        <radialGradient id="housing" r="1">
          <stop offset="0.55" stopColor="#0f1a2c" />
          <stop offset="0.8" stopColor="#0a1220" />
          <stop offset="1" stopColor="#04070d" />
        </radialGradient>
        <radialGradient id="sheen" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#5be3ff" stopOpacity="0.16" />
          <stop offset="0.6" stopColor="#5be3ff" stopOpacity="0" />
        </radialGradient>
        <path id="textring" d="M -79 0 a 79 79 0 1 1 158 0 a 79 79 0 1 1 -158 0" />
      </defs>

      <path d={`${ring(99)} ${ring(APERTURE)}`} fill="url(#housing)" fillRule="evenodd" />
      <circle r="99" fill="none" stroke="rgba(120,200,240,0.25)" strokeWidth="0.4" />

      <motion.g style={{ rotate: knurl }}>
        {ticks.map((a) => (
          <line
            key={a}
            x1="0"
            y1="-89"
            x2="0"
            y2={a % 30 === 0 ? -96 : -93}
            stroke={a % 30 === 0 ? 'rgba(91,227,255,0.6)' : 'rgba(150,180,210,0.22)'}
            strokeWidth="0.45"
            transform={`rotate(${a})`}
          />
        ))}
      </motion.g>

      <text fontFamily="IBM Plex Mono, monospace" fontSize="4.2" letterSpacing="1.4" fill="rgba(129,147,173,0.9)">
        <textPath href="#textring">
          CAM AI · CAM-01 · 4.0 mm · F/1.6 · IR-CUT · RTSP OUT · CAM AI · CAM-01 · 4.0 mm · F/1.6 · IR-CUT ·
        </textPath>
      </text>

      {leds.map((a) => (
        <g key={a} transform={`rotate(${a}) translate(0 -69)`}>
          <circle r="2.2" fill="#1a0f08" stroke="rgba(255,181,71,0.35)" strokeWidth="0.4" />
          <circle r="0.9" fill="rgba(255,181,71,0.55)" />
        </g>
      ))}

      <circle r="64" fill="none" stroke="rgba(91,227,255,0.28)" strokeWidth="0.5" />
      <circle r={APERTURE + 1.2} fill="none" stroke="rgba(91,227,255,0.55)" strokeWidth="0.8" />
      <circle r={APERTURE} fill="url(#sheen)" />
      <path d="M -38 -30 A 48 48 0 0 1 10 -50" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 30 40 A 50 50 0 0 1 12 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  )
}

const CALLOUTS = [
  { k: 'LENS', v: 'Captures the room', pos: 'left-[6%] top-[22%] md:left-[12%]', align: 'text-left' },
  { k: 'SENSOR', v: 'Turns light into pixels', pos: 'right-[6%] top-[22%] md:right-[14%]', align: 'text-right' },
  { k: 'ENCODER', v: 'Compresses each frame', pos: 'left-[6%] bottom-[22%] md:left-[12%]', align: 'text-left' },
  { k: 'RTSP', v: 'Streams it to Server 01', pos: 'right-[6%] bottom-[22%] md:right-[14%]', align: 'text-right' },
]

/** The frame, seen up close: a field of pixel values. */
function PixelField() {
  const cells = useMemo(() => {
    const rnd = mulberry32(11)
    return Array.from({ length: 16 * 9 }, (_, i) => {
      const x = i % 16
      const y = Math.floor(i / 16)
      // a soft blob of "brightness" where the window light falls
      const v = Math.min(255, Math.round(60 + 120 * Math.exp(-((x - 11) ** 2 + (y - 3) ** 2) / 30) + rnd() * 50))
      return v
    })
  }, [])
  return (
    <div className="grid h-full w-full grid-cols-[repeat(16,1fr)] grid-rows-[repeat(9,1fr)] gap-px bg-line/40">
      {cells.map((v, i) => (
        <div
          key={i}
          className="flex items-center justify-center font-mono text-[clamp(7px,0.9vw,12px)] text-ink/55"
          style={{ background: `rgba(91,227,255,${(v / 255) * 0.32})` }}
        >
          {v}
        </div>
      ))}
    </div>
  )
}

export default function CameraLens() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { w, h } = useViewport()
  const mobile = w < 768
  const R = Math.min(w, h) * (mobile ? 0.3 : 0.22)
  const full = Math.hypot(w, h) / 2 + 24

  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const radius = useTransform(p, [0.02, 0.28], [full, R])
  const clip = useMotionTemplate`circle(${radius}px at 50% 50%)`
  const zoom = useTransform(p, [0.52, 0.76], [1, 7.5], { clamp: true })
  const ringsOpacity = useTransform(p, [0.1, 0.24, 0.6, 0.68], [0, 1, 1, 0])
  const ringsScale = useTransform(p, [0.1, 0.3], [1.3, 1])
  const knurl = useTransform(p, [0, 1], [0, 140])
  const blurPx = useTransform(p, [0.56, 0.72], [0, 10])
  const feedFilter = useMotionTemplate`blur(${blurPx}px)`
  const digitalOpacity = useTransform(p, [0.66, 0.78], [0, 1])
  const digitalScale = useTransform(p, [0.66, 0.95], [1.8, 1])

  const t1 = useTransform(p, [0.03, 0.09, 0.24, 0.3], [0, 1, 1, 0])
  const t2 = useTransform(p, [0.3, 0.35, 0.48, 0.54], [0, 1, 1, 0])
  const t3 = useTransform(p, [0.78, 0.84], [0, 1])
  const callouts = useTransform(p, [0.28, 0.33, 0.47, 0.52], [0, 1, 1, 0])
  const y1 = useTransform(p, [0.03, 0.3], reduce ? [0, 0] : [30, -30])
  const y2 = useTransform(p, [0.3, 0.54], reduce ? [0, 0] : [30, -30])

  const lensSize = R * 2 * (100 / APERTURE)

  return (
    <Stage id="camera" className="h-[340vh] max-md:h-[260vh]">
      <div ref={ref} className="absolute inset-0" />
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-void">
        <div className="grid-bg grid-fade absolute inset-0 opacity-60" />

        {/* lens + feed, zoomed as one */}
        <motion.div className="absolute inset-0" style={{ scale: zoom }} data-cursor="camera">
          <motion.div className="absolute inset-0" style={{ clipPath: clip, filter: feedFilter }}>
            <ClassroomFeed className="h-full w-full" hud={false} />
          </motion.div>
          <motion.div
            className="absolute top-1/2 left-1/2"
            style={{
              width: lensSize,
              height: lensSize,
              marginLeft: -lensSize / 2,
              marginTop: -lensSize / 2,
              opacity: ringsOpacity,
              scale: ringsScale,
            }}
          >
            <LensRings knurl={knurl} />
          </motion.div>
        </motion.div>

        {/* inside the frame: pixels */}
        <motion.div className="absolute inset-0 bg-void" style={{ opacity: digitalOpacity }}>
          <motion.div className="absolute inset-0" style={{ scale: digitalScale }}>
            <PixelField />
          </motion.div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#04070d_85%)]" />
          <motion.div
            style={{ opacity: t3 }}
            className="absolute inset-x-5 bottom-[14%] text-center md:inset-x-0"
          >
            <p className="eyebrow mb-4 text-signal">FRAME 000142 · PIXELS → PACKETS</p>
            <p className="display text-[clamp(1.6rem,4vw,3.4rem)] text-ink">Every frame becomes data.</p>
          </motion.div>
        </motion.div>

        {/* callouts around the lens */}
        <motion.div style={{ opacity: callouts }} className="pointer-events-none absolute inset-0 hidden sm:block">
          {CALLOUTS.map((c) => (
            <div key={c.k} className={`absolute ${c.pos} ${c.align}`}>
              <p className="eyebrow text-signal">{c.k}</p>
              <p className="mt-1 text-sm text-ink/80">{c.v}</p>
            </div>
          ))}
        </motion.div>

        {/* narration */}
        <motion.div
          style={{ opacity: t1, y: y1 }}
          className="pointer-events-none absolute inset-x-5 bottom-[10%] md:inset-x-12 lg:inset-x-16"
        >
          <p className="eyebrow mb-4 text-signal">01 · CAPTURE</p>
          <h2 className="display text-glow max-w-4xl text-[clamp(2.4rem,7.5vw,7rem)] text-ink">It starts with a camera.</h2>
        </motion.div>
        <motion.div
          style={{ opacity: t2, y: y2 }}
          className="pointer-events-none absolute inset-x-5 bottom-[8%] text-center md:inset-x-0"
        >
          <p className="display-soft mx-auto max-w-2xl text-[clamp(1.5rem,3.2vw,2.6rem)] text-ink">
            Every classroom begins as a live visual stream.
          </p>
        </motion.div>
      </div>
    </Stage>
  )
}
