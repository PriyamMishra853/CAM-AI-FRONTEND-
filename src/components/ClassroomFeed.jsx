import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { createClassroom, drawClassroom, W, H } from '../lib/classroomScene'
import { useOnScreen, useTier } from '../lib/hooks'

const scenes = new Map()
const getScene = (seed) => {
  if (!scenes.has(seed)) scenes.set(seed, createClassroom(seed))
  return scenes.get(seed)
}

let noiseUrl = null
function getNoise() {
  if (noiseUrl) return noiseUrl
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(128, 128)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 22
  }
  ctx.putImageData(img, 0, 0)
  return (noiseUrl = c.toDataURL())
}

function useClock(enabled) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [enabled])
  return now
}

const pad = (n) => String(n).padStart(2, '0')
export const formatStamp = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}  ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

/**
 * A classroom camera feed. Renders a real video when `videoSrc` is given
 * (lazy: it only loads once on screen), otherwise the procedural scene.
 *
 * `reveal` may be a number or a framer-motion MotionValue (0–1) and controls
 * the AI detection overlay; leave it undefined for a plain feed.
 */
export default function ClassroomFeed({
  reveal,
  videoSrc,
  hud = true,
  camId = 'CAM-01',
  room = 'CSE — 2A',
  seed = 7,
  className = '',
}) {
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const [wrapRef, onScreen] = useOnScreen('200px')
  const reduce = useReducedMotion()
  const tier = useTier()
  const now = useClock(hud && onScreen)
  const [videoFailed, setVideoFailed] = useState(false)
  const useVideo = Boolean(videoSrc) && !videoFailed && reveal === undefined

  useEffect(() => {
    if (useVideo) return
    const canvas = canvasRef.current
    if (!canvas || !onScreen) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const scene = getScene(seed)
    const scale = tier === 'mobile' ? 0.6 : 1
    canvas.width = W * scale
    canvas.height = H * scale
    ctx.setTransform(scale, 0, 0, scale, 0, 0)

    const readReveal = () => (reveal == null ? null : typeof reveal.get === 'function' ? reveal.get() : reveal)
    const render = (t) => drawClassroom(ctx, scene, t, { motion: !reduce, reveal: readReveal() })

    if (reduce) {
      render(0)
      const unsub = typeof reveal?.on === 'function' ? reveal.on('change', () => render(0)) : null
      return () => unsub?.()
    }

    const fps = tier === 'desktop' ? 24 : 15
    let raf
    let last = 0
    const loop = (ms) => {
      raf = requestAnimationFrame(loop)
      if (ms - last < 1000 / fps) return
      last = ms
      render(ms / 1000)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [onScreen, reduce, tier, reveal, useVideo, seed])

  useEffect(() => {
    const v = videoRef.current
    if (!useVideo || !v) return
    if (onScreen && !reduce) v.play().catch(() => {})
    else v.pause()
  }, [onScreen, useVideo, reduce])

  return (
    <div ref={wrapRef} className={`relative overflow-hidden bg-abyss ${className}`}>
      {useVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={onScreen ? videoSrc : undefined}
          muted
          loop
          playsInline
          preload="none"
          onError={() => setVideoFailed(true)}
          style={{ filter: 'saturate(0.55) contrast(1.05)' }}
        />
      ) : (
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Live classroom camera view, ${camId}, ${room}`}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'saturate(0.6) contrast(1.06) brightness(0.95)' }}
        />
      )}

      {/* camera grade: cool tint, vignette, scanlines, sensor grain */}
      <div className="pointer-events-none absolute inset-0 bg-[#0b2a3a] mix-blend-color opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(2,5,10,0.75)_100%)]" />
      <div className="scanlines pointer-events-none absolute inset-0 opacity-60" />
      {!reduce && onScreen && (
        <div
          className="pointer-events-none absolute -inset-[50%] animate-grain"
          style={{ backgroundImage: `url(${getNoise()})` }}
        />
      )}

      {hud && (
        <div className="telemetry pointer-events-none absolute inset-0 p-4 text-[10px] text-ink/80 md:p-6 md:text-[11px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-tally" />
              REC · {camId}
            </span>
            <span>{formatStamp(now)}</span>
          </div>
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">{room} · RTSP · H.264</div>
        </div>
      )}
    </div>
  )
}
