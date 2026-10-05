import { useMemo, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { mulberry32 } from '../lib/hooks'
import { GpuIcon, LockIcon, ServerIcon } from './ui/Icons'
import { Reveal, Stage } from './ui/primitives'

const POINTS = [
  ['Authenticated', 'Only key-holding hosts can open the channel.'],
  ['Encrypted', 'Frames and results travel inside the tunnel.'],
  ['Dispatched', 'Server 01 sends jobs; results come back the same way.'],
]

function Cipher({ reverse = false, seed }) {
  // Random glyphs — illustrative ciphertext, not real key material.
  const text = useMemo(() => {
    const r = mulberry32(seed)
    return Array.from({ length: 120 }, () => '0123456789abcdef'[Math.floor(r() * 16)]).join('')
  }, [seed])
  return (
    <div className="overflow-hidden whitespace-nowrap font-mono text-[10px] tracking-[0.25em] text-signal/50">
      <div
        className="inline-block"
        style={{ animation: `marquee 14s linear infinite ${reverse ? 'reverse' : ''}` }}
      >
        {text}
        {text}
      </div>
      <style>{`@keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }`}</style>
    </div>
  )
}

function Endpoint({ label, sub, Icon, cursor }) {
  return (
    <div data-cursor={cursor} className="glass flex w-[30%] shrink-0 flex-col items-center gap-2 px-3 py-5 text-center">
      <Icon className="h-6 w-6 text-signal" />
      <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-ink">{label}</span>
      <span className="telemetry text-[10px]">{sub}</span>
    </div>
  )
}

export default function SecureLink() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })

  return (
    <Stage id="secure-link" className="overflow-hidden py-28 md:py-36">
      <div className="relative mx-auto grid max-w-[1400px] items-center gap-14 px-5 md:px-12 lg:grid-cols-[0.8fr_1.2fr] lg:px-16 lg:pr-36">
        <div>
          <Reveal>
            <p className="eyebrow mb-5 flex items-center gap-3 text-signal/80">
              <span className="h-px w-8 bg-signal/50" />
              07 · Dispatch
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="display text-[clamp(2.2rem,5vw,4.4rem)] text-ink">
              Secure remote
              <br />
              computation
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-mute">
              AI workloads can be securely dispatched to the high-performance compute environment through authenticated
              SSH-based infrastructure.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="min-w-0">
          <div ref={ref} className="glass brackets p-5 md:p-8">
            <div className="flex items-center">
              <Endpoint label="SERVER 01" sub="Dispatcher" Icon={ServerIcon} cursor="server" />
              <div className="relative min-w-0 flex-1 px-1">
                <div className="space-y-1 border-y border-signal/40 bg-signal/[0.03] py-2">
                  <Cipher seed={1} />
                  <Cipher seed={2} reverse />
                </div>
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={inView ? { scale: 1, opacity: 1 } : {}}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-1/2 left-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-signal bg-void shadow-[0_0_24px_-2px_rgba(91,227,255,0.6)]"
                >
                  <LockIcon open={!inView} className="h-5 w-5 text-signal transition-all duration-700" />
                </motion.div>
              </div>
              <Endpoint label="SERVER 02" sub="DGX A100" Icon={GpuIcon} cursor="gpu" />
            </div>
            <p className="telemetry mt-4 text-center text-[10px] text-signal">SSH · KEY-BASED AUTH · ENCRYPTED CHANNEL</p>

            <ul className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
              {POINTS.map(([k, v]) => (
                <li key={k}>
                  <p className="font-mono text-[11px] tracking-[0.16em] text-ink uppercase">✓ {k}</p>
                  <p className="mt-1 text-[13px] leading-snug text-mute">{v}</p>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </Stage>
  )
}
