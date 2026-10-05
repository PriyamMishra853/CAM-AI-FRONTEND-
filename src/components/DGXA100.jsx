import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { mulberry32, useOnScreen, useTier } from '../lib/hooks'
import { Stage } from './ui/primitives'

const CONCEPTS = ['GPU compute', 'AI models', 'Vision pipeline', 'Inference', 'Model processing']
const PATH = ['Camera', 'Server 01', 'Server 02', 'NVIDIA DGX A100', 'AI inference', 'Attendance']

/**
 * Eight GPU modules on a shared interconnect. Core activity, inter-GPU
 * traffic, incoming inference requests (amber) and outgoing results (cyan).
 * Purely illustrative — no performance figures are implied.
 */
function GpuArray({ className = '' }) {
  const canvasRef = useRef(null)
  const [wrapRef, onScreen] = useOnScreen('100px')
  const reduce = useReducedMotion()
  const tier = useTier()

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap || !onScreen) return
    const ctx = canvas.getContext('2d')
    const rnd = mulberry32(5)
    const phases = Array.from({ length: 8 * 120 }, () => rnd() * Math.PI * 2)
    const speeds = Array.from({ length: 8 * 120 }, () => 0.6 + rnd() * 2.2)
    let w = 0
    let h = 0
    let layout = null

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      w = wrap.clientWidth
      h = wrap.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const twoRows = w < 700
      const cols = twoRows ? 4 : 8
      const rows = twoRows ? 2 : 1
      const padX = Math.max(28, w * 0.06)
      const busH = 34
      const gap = Math.max(8, w * 0.012)
      const mw = (w - padX * 2 - gap * (cols - 1)) / cols
      const mh = (h - 40 - busH - gap * (rows - 1)) / rows
      const mods = []
      for (let i = 0; i < 8; i++) {
        const c = i % cols
        const r = Math.floor(i / cols)
        mods.push({ x: padX + c * (mw + gap), y: 20 + r * (mh + gap), w: mw, h: mh, i })
      }
      layout = { mods, busY: h - busH + 6, padX, cores: twoRows ? [6, 8] : [5, 12] }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h)
      const { mods, busY, padX, cores } = layout
      const [cc, cr] = cores

      // interconnect
      ctx.strokeStyle = 'rgba(91,227,255,0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padX, busY)
      ctx.lineTo(w - padX, busY)
      ctx.stroke()
      ctx.font = '500 9px "IBM Plex Mono", monospace'
      ctx.fillStyle = 'rgba(129,147,173,0.9)'
      ctx.fillText('GPU INTERCONNECT', padX, busY + 16)

      mods.forEach((m) => {
        const load = 0.55 + 0.45 * Math.sin(t * 0.7 + m.i * 0.9)
        // drop to bus
        ctx.strokeStyle = 'rgba(91,227,255,0.18)'
        ctx.beginPath()
        ctx.moveTo(m.x + m.w / 2, m.y + m.h)
        ctx.lineTo(m.x + m.w / 2, busY)
        ctx.stroke()

        ctx.fillStyle = '#070d19'
        ctx.fillRect(m.x, m.y, m.w, m.h)
        ctx.strokeStyle = `rgba(91,227,255,${0.25 + load * 0.35})`
        ctx.strokeRect(m.x + 0.5, m.y + 0.5, m.w - 1, m.h - 1)

        ctx.fillStyle = '#e6eef8'
        ctx.font = '600 10px "IBM Plex Mono", monospace'
        ctx.fillText(`GPU ${String(m.i + 1).padStart(2, '0')}`, m.x + 8, m.y + 16)

        const gx = m.x + 8
        const gy = m.y + 26
        const gw = m.w - 16
        const gh = m.h - 44
        const cw = gw / cc
        const ch = gh / cr
        for (let r = 0; r < cr; r++) {
          for (let c = 0; c < cc; c++) {
            const k = m.i * 120 + r * cc + c
            const s = Math.sin(t * speeds[k] + phases[k])
            const a = 0.08 + load * 0.85 * Math.max(0, s) ** 3
            ctx.fillStyle = `rgba(91,227,255,${a})`
            ctx.fillRect(gx + c * cw + 1, gy + r * ch + 1, cw - 2, ch - 2)
          }
        }
        // activity bar (relative, unlabelled)
        ctx.fillStyle = 'rgba(120,170,220,0.15)'
        ctx.fillRect(gx, m.y + m.h - 10, gw, 3)
        ctx.fillStyle = '#5be3ff'
        ctx.fillRect(gx, m.y + m.h - 10, gw * load, 3)
      })

      if (!reduce) {
        // traffic between GPUs along the bus
        for (let k = 0; k < 6; k++) {
          const u = (t * 0.25 + k / 6) % 1
          const x = padX + u * (w - padX * 2)
          ctx.fillStyle = 'rgba(91,227,255,0.9)'
          ctx.fillRect(x - 3, busY - 1.5, 6, 3)
        }
        // requests in (left), results out (right)
        for (let k = 0; k < 3; k++) {
          const u = (t * 0.5 + k / 3) % 1
          ctx.fillStyle = `rgba(255,181,71,${1 - u})`
          ctx.fillRect(u * padX * 0.9, busY - 2, 4, 4)
          ctx.fillStyle = `rgba(91,227,255,${u})`
          ctx.fillRect(w - padX + u * padX * 0.9, busY - 2, 4, 4)
        }
      }
    }

    if (reduce) {
      draw(1.3)
      return () => ro.disconnect()
    }
    const fps = tier === 'desktop' ? 30 : 20
    let raf
    let last = 0
    const loop = (ms) => {
      raf = requestAnimationFrame(loop)
      if (ms - last < 1000 / fps) return
      last = ms
      draw(ms / 1000)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [onScreen, reduce, tier, wrapRef])

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="Eight A100 GPU modules processing inference requests"
      />
    </div>
  )
}

export default function DGXA100() {
  const ref = useRef(null)
  const tier = useTier()
  const sticky = tier !== 'mobile'
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const done = useMotionValue(1)
  const p = sticky ? scrollYProgress : done

  const bezelY = useTransform(p, [0.12, 0.42], ['0%', '-101%'])
  const bezelOpacity = useTransform(p, [0.36, 0.44], [1, 0])
  const chipsOpacity = useTransform(p, [0.45, 0.58], [0, 1])
  const pathOpacity = useTransform(p, [0.58, 0.7], [0, 1])

  return (
    <Stage id="dgx" className={sticky ? 'h-[260vh]' : 'py-28'}>
      <div ref={ref} className="absolute inset-0" />
      <div className={sticky ? 'sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden' : 'relative'}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(91,227,255,0.10),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-[1300px] px-5 md:px-12 lg:px-16 lg:pr-36">
          <p className="eyebrow mb-4 flex items-center gap-3 text-signal/80">
            <span className="h-px w-8 bg-signal/50" />
            08 · Accelerate
          </p>
          <h2 className="display text-[clamp(2rem,5.4vw,5rem)] text-ink">
            Powered by <span className="text-signal">NVIDIA DGX A100</span>
          </h2>
          <p className="mt-3 max-w-xl text-mute md:text-lg">
            High-performance computation for computer vision and AI workloads.
          </p>

          {/* chassis */}
          <div className="mt-8 border border-line-strong bg-abyss p-1.5 shadow-[0_40px_120px_-40px_rgba(91,227,255,0.35)]" data-cursor="gpu">
            <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
              <span className="telemetry text-[10px]">DGX A100 · SERVER 02 COMPUTE</span>
              <span className="telemetry flex items-center gap-1.5 text-[10px] text-signal">
                <span className="h-1.5 w-1.5 animate-blink rounded-full bg-signal" /> ACTIVE
              </span>
            </div>
            <div className="relative h-[clamp(260px,40vh,400px)] overflow-hidden max-sm:h-[340px]">
              <GpuArray className="h-full w-full" />
              <motion.div
                style={{ y: bezelY, opacity: bezelOpacity }}
                className="absolute inset-0 flex items-center justify-center border-b border-line-strong bg-[#0b1322]"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(129,147,173,0.35)_1.2px,transparent_1.6px)] bg-[length:9px_9px]" />
                <span className="relative bg-[#0b1322] px-4 py-1 font-mono text-[11px] tracking-[0.3em] text-mute">
                  SCROLL TO OPEN
                </span>
              </motion.div>
            </div>
          </div>

          <motion.div style={{ opacity: chipsOpacity }} className="mt-5 flex flex-wrap items-center gap-2">
            <span className="mr-3 font-mono text-[13px] font-semibold tracking-[0.14em] text-signal">8× NVIDIA A100 GPUs</span>
            {CONCEPTS.map((c) => (
              <span key={c} className="border border-line px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-ink/80 uppercase">
                {c}
              </span>
            ))}
          </motion.div>

          <motion.ol
            style={{ opacity: pathOpacity }}
            className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] tracking-[0.14em] uppercase"
            aria-label="Signal path"
          >
            {PATH.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className={s.includes('DGX') ? 'text-signal' : 'text-mute'}>{s}</span>
                {i < PATH.length - 1 && <span className="text-mute/50">→</span>}
              </li>
            ))}
          </motion.ol>
        </div>
      </div>
    </Stage>
  )
}
