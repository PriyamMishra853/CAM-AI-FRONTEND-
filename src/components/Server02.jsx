import { useMemo, useRef } from 'react'
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Stage } from './ui/primitives'

/** A small layered network that pulses inside the Server 02 core. */
export function NeuralCore({ className = '' }) {
  const layers = useMemo(() => {
    const cols = [4, 6, 6, 3]
    return cols.map((n, li) =>
      Array.from({ length: n }, (_, i) => ({ x: 14 + li * 24, y: 50 + (i - (n - 1) / 2) * 13, id: `${li}-${i}` })),
    )
  }, [])
  const edges = []
  layers.slice(0, -1).forEach((layer, li) =>
    layer.forEach((a) => layers[li + 1].forEach((b) => edges.push([a, b]))),
  )
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {edges.map(([a, b], i) => (
        <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(91,227,255,0.14)" strokeWidth="0.3" />
      ))}
      {layers.flat().map((n, i) => (
        <circle
          key={n.id}
          cx={n.x}
          cy={n.y}
          r="1.8"
          fill="#5be3ff"
          style={{ animation: `neuron 2.4s ${(i % 7) * 0.22 + Math.floor(i / 7) * 0.1}s infinite ease-in-out` }}
        />
      ))}
      <style>{`@keyframes neuron { 0%,100%{opacity:.25} 40%{opacity:1} }`}</style>
    </svg>
  )
}

export default function Server02() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const s01Scale = useTransform(p, [0.0, 0.32], [1, 0.45])
  const s01Y = useTransform(p, [0.0, 0.32], ['0vh', '-34vh'])
  const s01Opacity = useTransform(p, [0, 0.05, 0.32, 0.6, 0.68], [0, 0.9, 0.55, 0.4, 0])
  const s01BlurV = useTransform(p, [0.05, 0.32], [0, 2])
  const s01Blur = useMotionTemplate`blur(${s01BlurV}px)`

  const beam = useTransform(p, [0.32, 0.56], [0, 1])
  const beamOpacity = useTransform(p, [0.3, 0.34, 0.62, 0.7], [0, 1, 1, 0])

  const s02Opacity = useTransform(p, [0.52, 0.64], [0, 1])
  const s02Scale = useTransform(p, [0.52, 0.72], [0.55, 1])
  const s02Glow = useTransform(p, [0.6, 0.8], [0, 1])

  const tA = useTransform(p, [0.04, 0.1, 0.24, 0.3], [0, 1, 1, 0])
  const tB = useTransform(p, [0.32, 0.38, 0.5, 0.55], [0, 1, 1, 0])
  const tC = useTransform(p, [0.68, 0.78], [0, 1])
  const yA = useTransform(p, [0.04, 0.3], reduce ? [0, 0] : [24, -24])
  const yB = useTransform(p, [0.32, 0.55], reduce ? [0, 0] : [24, -24])

  return (
    <Stage id="server-02" className="h-[320vh] max-md:h-[260vh]">
      <div ref={ref} className="absolute inset-0" />
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="grid-bg grid-fade absolute inset-0 opacity-50" />

        {/* Server 01 recedes */}
        <motion.div
          style={{ scale: s01Scale, y: s01Y, opacity: s01Opacity, filter: s01Blur }}
          className="absolute top-1/2 left-1/2 -mt-[min(13vw,110px)] -ml-[min(13vw,110px)] h-[min(26vw,220px)] w-[min(26vw,220px)]"
          data-cursor="server"
        >
          <div className="glass flex h-full w-full flex-col items-center justify-center">
            <span className="eyebrow text-[9px]">Server</span>
            <span className="display text-[clamp(2rem,5vw,3.6rem)] text-ink/80">01</span>
          </div>
        </motion.div>

        {/* data beam S01 → S02 */}
        <motion.div
          style={{ scaleY: beam, opacity: beamOpacity }}
          className="absolute top-[22%] left-1/2 h-[24%] w-px origin-top bg-gradient-to-b from-signal/20 via-signal to-signal shadow-[0_0_14px_#5be3ff]"
        >
          {!reduce &&
            [0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="absolute -left-[3px] h-[7px] w-[7px] rounded-full bg-signal shadow-[0_0_10px_#5be3ff]"
                style={{ animation: `beam 1.6s ${i * 0.4}s linear infinite` }}
              />
            ))}
          <style>{`@keyframes beam { from{top:0;opacity:0} 15%{opacity:1} to{top:100%;opacity:.2} }`}</style>
        </motion.div>

        {/* Server 02 arrives */}
        <motion.div
          style={{ opacity: s02Opacity, scale: s02Scale }}
          className="absolute top-[46%] left-1/2 h-[min(56vw,300px)] w-[min(56vw,300px)] -translate-x-1/2"
          data-cursor="server"
        >
          <motion.div
            style={{ opacity: s02Glow }}
            className="absolute -inset-10 rounded-full bg-signal/15 blur-3xl"
          />
          <div className="glass glow-signal relative flex h-full w-full flex-col p-4">
            <div className="flex items-center justify-between">
              <span className="eyebrow text-[9px] text-signal">Server 02</span>
              <span className="telemetry text-[9px]">AI ENGINE</span>
            </div>
            <NeuralCore className="flex-1" />
          </div>
        </motion.div>

        {/* narration */}
        <motion.div
          style={{ opacity: tA, y: yA }}
          className="pointer-events-none absolute inset-x-5 top-1/2 -translate-y-1/2 text-center"
        >
          <h2 className="display text-[clamp(2.2rem,6.4vw,6rem)] text-ink">
            But storage is
            <br />
            not intelligence.
          </h2>
        </motion.div>
        <motion.div
          style={{ opacity: tB, y: yB }}
          className="pointer-events-none absolute inset-x-5 top-[28%] text-center"
        >
          <h2 className="display text-glow text-[clamp(1.8rem,5vw,4.6rem)] text-signal">
            The real computation
            <br />
            begins here.
          </h2>
        </motion.div>
        <motion.div
          style={{ opacity: tC }}
          className="pointer-events-none absolute inset-x-5 top-[14%] text-center md:inset-x-0"
        >
          <p className="eyebrow mb-4 text-signal">05 · Compute</p>
          <h2 className="display text-[clamp(2.6rem,7vw,6.2rem)] text-ink">Server 02</h2>
          <p className="display-soft mt-3 text-[clamp(1rem,2vw,1.6rem)] text-ink/90">AI computation engine</p>
          <p className="mt-2 text-mute">Where visual data becomes intelligence.</p>
        </motion.div>
      </div>
    </Stage>
  )
}
