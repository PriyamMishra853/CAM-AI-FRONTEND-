import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { API_CONFIG } from '../config/api'
import { scrollToStage } from '../lib/stages'
import ClassroomFeed from './ClassroomFeed'
import LoginPanel from './LoginPanel'
import { ArrowDown } from './ui/Icons'
import { PrimaryButton, Stage } from './ui/primitives'

const ease = [0.16, 1, 0.3, 1]

/** First frame: the feed connects, then the system identifies itself. */
function BootSequence({ onDone }) {
  const lines = ['OPENING RTSP SESSION · CAM-01', 'NEGOTIATING H.264 STREAM', 'SIGNAL ACQUIRED']
  const [n, setN] = useState(0)
  useEffect(() => {
    if (n >= lines.length) {
      const t = setTimeout(onDone, 350)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setN((v) => v + 1), 380)
    return () => clearTimeout(t)
  }, [n, lines.length, onDone])
  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-center justify-center bg-void"
      exit={{ opacity: 0, transition: { duration: 0.9, ease } }}
    >
      <div className="telemetry space-y-2 text-[12px]">
        {lines.slice(0, n + 1).map((l, i) => (
          <p key={l} className={i === lines.length - 1 ? 'text-signal' : 'text-mute'}>
            <span className="mr-3 text-ink/30">{String(i + 1).padStart(2, '0')}</span>
            {l}
            {i === n && i < lines.length - 1 && <span className="ml-1 animate-blink">_</span>}
          </p>
        ))}
      </div>
    </motion.div>
  )
}

export default function Hero() {
  const reduce = useReducedMotion()
  const [booted, setBooted] = useState(reduce)
  const show = (delay) => ({
    initial: { opacity: 0, y: reduce ? 0 : 28 },
    animate: booted ? { opacity: 1, y: 0 } : {},
    transition: { duration: 1, delay, ease },
  })

  return (
    <Stage id="classroom" className="min-h-[100svh] overflow-hidden">
      <ClassroomFeed className="!absolute inset-0" hud={false} videoSrc={API_CONFIG.heroVideoUrl} />
      {/* legibility: heavy on the copy side, open over the room */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-void via-void/80 to-void/10 max-lg:via-void/70 max-lg:to-void/50" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-void to-transparent" />

      <AnimatePresence>{!booted && <BootSequence onDone={() => setBooted(true)} />}</AnimatePresence>

      <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-[1400px] items-center gap-14 px-5 pt-24 pb-28 md:px-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-16 lg:pr-36">
        <div>
          <motion.p {...show(0)} className="eyebrow mb-6 flex items-center gap-3 text-signal/80">
            <span className="h-px w-8 bg-signal/50" />
            Camera intelligence · attendance &amp; analytics
          </motion.p>

          <motion.h1
            {...show(0.08)}
            className="display text-glow text-[clamp(4rem,13vw,8.6rem)] lg:text-[clamp(4rem,8.6vw,8.6rem)] leading-[0.82] text-ink"
          >
            CAM<span className="text-signal">&nbsp;</span>AI
          </motion.h1>

          <motion.p {...show(0.2)} className="display-soft mt-8 text-[clamp(1.7rem,3.6vw,3.1rem)] text-ink">
            See the Classroom.
            <br />
            <span className="text-signal">Understand the Room.</span>
          </motion.p>

          <motion.p {...show(0.3)} className="mt-6 max-w-lg text-[clamp(1rem,1.3vw,1.15rem)] leading-relaxed text-mute">
            AI-powered camera intelligence for automated attendance, classroom monitoring and real-time student
            analytics.
          </motion.p>

          <motion.div {...show(0.4)} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
            <PrimaryButton onClick={() => scrollToStage('camera')}>Enter CAM AI</PrimaryButton>
            <span className="telemetry text-[11px] tracking-[0.14em]">AI-assisted • Camera-driven • Real-time</span>
          </motion.div>
        </div>

        <motion.div {...show(0.5)} className="flex justify-center lg:justify-end">
          <LoginPanel />
        </motion.div>
      </div>

      <motion.button
        type="button"
        {...show(0.8)}
        onClick={() => scrollToStage('camera')}
        className="telemetry absolute bottom-10 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] hover:text-signal md:flex"
      >
        FOLLOW THE SIGNAL
        <ArrowDown width={14} height={14} className="animate-bounce" />
      </motion.button>
    </Stage>
  )
}
