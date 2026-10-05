/**
 * Procedural classroom, rendered as if from a ceiling camera mounted above the
 * whiteboard looking back at the students. Pure Canvas 2D (no WebGL), drawn in
 * a fixed 1600×900 virtual space; the <canvas> is scaled with CSS object-fit.
 *
 * World units ≈ metres. Camera sits 3 m up; D is distance from the camera.
 */
import { mulberry32 } from './hooks'

export const W = 1600
export const H = 900
const F = 400 // focal length in px
const CAM_H = 3
const VP_X = W / 2
const VP_Y = 170
const ROOM_HALF = 5.2
const BACK_D = 8

const project = (x, y, d) => [VP_X + (x * F) / d, VP_Y + (F * (CAM_H - y)) / d]

function quad(ctx, pts) {
  ctx.beginPath()
  pts.forEach(([x, y, d], i) => {
    const [px, py] = project(x, y, d)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.closePath()
}

const CLOTHES = ['#3d4f63', '#5a3f45', '#2f3d33', '#6b6f78', '#24303f', '#7a6a55', '#4a4f6b', '#8a8f96', '#30363d', '#5d6b5a']
const SKIN = ['#c79a7c', '#a9785a', '#8a5c42', '#e0b494', '#6e4630', '#d6a98a', '#b88466']
const HAIR = ['#1b1714', '#2a211b', '#3b2c22', '#0f0e0e', '#4a3a2c']

const ROWS = [2.15, 3.0, 3.85, 4.7, 5.55, 6.4]
const COLS = [-3.05, -2.2, -1.35, -0.5, 0.5, 1.35, 2.2, 3.05]
let roomCache = null

/** Build the seating plan. 48 seats, 42 occupied, 2 of those unconfirmed. */
export function createClassroom(seed = 7) {
  const rnd = mulberry32(seed)
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
  const empty = new Set([5, 14, 27, 33, 40, 46])
  const unconfirmed = new Set([37, 44])

  const students = []
  ROWS.forEach((d, r) => {
    COLS.forEach((x, c) => {
      const i = r * COLS.length + c
      if (empty.has(i)) return
      students.push({
        i,
        x: x + (rnd() - 0.5) * 0.12,
        d: d + (rnd() - 0.5) * 0.1,
        row: r,
        clothes: pick(CLOTHES),
        skin: pick(SKIN),
        hair: pick(HAIR),
        longHair: rnd() < 0.35,
        build: 0.92 + rnd() * 0.18,
        height: 1.18 + rnd() * 0.1,
        phase: rnd() * Math.PI * 2,
        writer: rnd() < 0.3,
        laptop: rnd() < 0.4,
        unconfirmed: unconfirmed.has(i),
        conf: unconfirmed.has(i) ? 0.55 + rnd() * 0.1 : 0.91 + rnd() * 0.08,
        tag: `S-${String(1000 + Math.floor(rnd() * 8999))}`,
        // reveal order: a left→right scan with a little jitter
        revealAt: 0,
      })
    })
  })
  students.forEach((s) => {
    const [px] = project(s.x, 1, s.d)
    s.revealAt = Math.min(0.95, Math.max(0, px / W) * 0.85 + rnd() * 0.08)
  })
  return { students, room: (roomCache ??= renderRoom()) }
}

/** Static room layer, rendered once to an offscreen canvas. */
function renderRoom() {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  const R = ROOM_HALF
  const B = BACK_D
  const NEAR = 1.0
  const TOP = 3.4

  // ceiling
  ctx.fillStyle = '#1a232c'
  ctx.fillRect(0, 0, W, H)
  // ceiling light fixtures
  for (const d of [2.2, 4.0, 5.8]) {
    for (const [x0, x1] of [
      [-2.6, -1.2],
      [1.2, 2.6],
    ]) {
      quad(ctx, [
        [x0, TOP, d],
        [x1, TOP, d],
        [x1, TOP, d + 0.5],
        [x0, TOP, d + 0.5],
      ])
      ctx.fillStyle = '#e8f1f5'
      ctx.shadowColor = 'rgba(220,240,255,0.9)'
      ctx.shadowBlur = 30
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }

  // back wall
  const [, wallTop] = project(0, TOP, B)
  const [, wallBot] = project(0, 0, B)
  let g = ctx.createLinearGradient(0, wallTop, 0, wallBot)
  g.addColorStop(0, '#46525d')
  g.addColorStop(1, '#5b6670')
  quad(ctx, [
    [-R, 0, B],
    [R, 0, B],
    [R, TOP, B],
    [-R, TOP, B],
  ])
  ctx.fillStyle = g
  ctx.fill()

  // left wall
  quad(ctx, [
    [-R, 0, B],
    [-R, TOP, B],
    [-R, TOP, NEAR],
    [-R, 0, NEAR],
  ])
  ctx.fillStyle = '#323d48'
  ctx.fill()

  // right wall (window side, brighter)
  quad(ctx, [
    [R, 0, B],
    [R, TOP, B],
    [R, TOP, NEAR],
    [R, 0, NEAR],
  ])
  ctx.fillStyle = '#4a5763'
  ctx.fill()

  // floor
  const [, floorNear] = project(0, 0, 1.6)
  g = ctx.createLinearGradient(0, wallBot, 0, floorNear)
  g.addColorStop(0, '#596169')
  g.addColorStop(1, '#3d454c')
  quad(ctx, [
    [-R, 0, B],
    [R, 0, B],
    [R, 0, NEAR],
    [-R, 0, NEAR],
  ])
  ctx.fillStyle = g
  ctx.fill()

  // floor tile seams
  ctx.strokeStyle = 'rgba(20,28,34,0.35)'
  ctx.lineWidth = 1
  for (let d = 1.2; d <= B; d += 0.6) {
    const [ax, ay] = project(-R, 0, d)
    const [bx, by] = project(R, 0, d)
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.stroke()
  }
  for (let x = -R; x <= R; x += 0.6) {
    const [ax, ay] = project(x, 0, B)
    const [bx, by] = project(x, 0, NEAR)
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.stroke()
  }

  // windows on the right wall + light falling across the floor
  for (const [d0, d1] of [
    [2.0, 3.3],
    [3.9, 5.2],
    [5.8, 7.1],
  ]) {
    quad(ctx, [
      [R, 1.0, d0],
      [R, 1.0, d1],
      [R, 2.7, d1],
      [R, 2.7, d0],
    ])
    const [wx] = project(R, 2, d0)
    g = ctx.createLinearGradient(wx, 0, wx - 120, 0)
    g.addColorStop(0, '#e3f0f6')
    g.addColorStop(1, '#a9c6d6')
    ctx.fillStyle = g
    ctx.shadowColor = 'rgba(210,235,250,0.8)'
    ctx.shadowBlur = 40
    ctx.fill()
    ctx.shadowBlur = 0
    // mullion
    ctx.strokeStyle = 'rgba(40,52,62,0.8)'
    ctx.lineWidth = 3
    const dm = (d0 + d1) / 2
    const [mx0, my0] = project(R, 1.0, dm)
    const [mx1, my1] = project(R, 2.7, dm)
    ctx.beginPath()
    ctx.moveTo(mx0, my0)
    ctx.lineTo(mx1, my1)
    ctx.stroke()

    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    quad(ctx, [
      [R, 0, d0],
      [R, 0, d1],
      [R - 3.4, 0, d1 + 0.6],
      [R - 3.4, 0, d0 + 0.6],
    ])
    ctx.fillStyle = 'rgba(160,190,205,0.10)'
    ctx.fill()
    ctx.restore()
  }

  // back-wall furniture: door, notice board, clock, cabinet
  quad(ctx, [
    [-4.7, 0, B],
    [-3.7, 0, B],
    [-3.7, 2.1, B],
    [-4.7, 2.1, B],
  ])
  ctx.fillStyle = '#2b333b'
  ctx.fill()
  quad(ctx, [
    [-2.2, 1.2, B],
    [0.6, 1.2, B],
    [0.6, 2.25, B],
    [-2.2, 2.25, B],
  ])
  ctx.fillStyle = '#6b5a48'
  ctx.fill()
  const rnd = mulberry32(3)
  for (let k = 0; k < 9; k++) {
    const x = -2.05 + rnd() * 2.3
    const y = 1.3 + rnd() * 0.65
    quad(ctx, [
      [x, y, B],
      [x + 0.28, y, B],
      [x + 0.28, y + 0.32, B],
      [x, y + 0.32, B],
    ])
    ctx.fillStyle = rnd() > 0.5 ? '#d9dcd6' : '#c7cfa8'
    ctx.fill()
  }
  const [cx, cy] = project(2.4, 2.55, B)
  ctx.beginPath()
  ctx.arc(cx, cy, 10, 0, Math.PI * 2)
  ctx.fillStyle = '#dfe3e3'
  ctx.fill()
  ctx.strokeStyle = '#222'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + 5, cy - 4)
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx, cy - 7)
  ctx.stroke()
  quad(ctx, [
    [3.0, 0, B],
    [4.8, 0, B],
    [4.8, 1.0, B],
    [3.0, 1.0, B],
  ])
  ctx.fillStyle = '#3c454d'
  ctx.fill()

  return c
}

function drawStudent(ctx, s, t, motion) {
  const sway = motion ? Math.sin(t * 0.35 + s.phase) * 0.025 : 0
  const breathe = motion ? Math.sin(t * 1.4 + s.phase) * 0.006 : 0
  const write = motion && s.writer ? Math.max(0, Math.sin(t * 0.5 + s.phase)) * 0.05 : 0
  const look = motion ? Math.sin(t * 0.18 + s.phase * 2) * 0.03 : 0

  const k = F / s.d
  const bw = 0.24 * s.build
  const shY = 1.0 + breathe
  const [sx, sy] = project(s.x + sway * 0.4, shY, s.d)
  const [, botY] = project(s.x, 0.62, s.d)

  // torso
  ctx.beginPath()
  ctx.moveTo(sx - bw * k, botY)
  ctx.lineTo(sx - bw * k, sy + 0.06 * k)
  ctx.quadraticCurveTo(sx - bw * k, sy - 0.02 * k, sx - 0.1 * k, sy - 0.03 * k)
  ctx.lineTo(sx + 0.1 * k, sy - 0.03 * k)
  ctx.quadraticCurveTo(sx + bw * k, sy - 0.02 * k, sx + bw * k, sy + 0.06 * k)
  ctx.lineTo(sx + bw * k, botY)
  ctx.closePath()
  ctx.fillStyle = s.clothes
  ctx.fill()

  // neck
  const [nx, ny] = project(s.x + sway * 0.6, shY + 0.07, s.d)
  ctx.fillStyle = s.skin
  ctx.fillRect(nx - 0.04 * k, ny - 0.02 * k, 0.08 * k, 0.07 * k)

  // head
  const [hx, hy] = project(s.x + sway + look, s.height - write, s.d)
  const hr = 0.1 * k
  if (s.longHair) {
    ctx.fillStyle = s.hair
    ctx.beginPath()
    ctx.ellipse(hx, hy + hr * 0.5, hr * 1.12, hr * 1.5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = s.skin
  ctx.beginPath()
  ctx.ellipse(hx, hy, hr * 0.86, hr, 0, 0, Math.PI * 2)
  ctx.fill()
  // hair cap
  ctx.fillStyle = s.hair
  ctx.beginPath()
  ctx.ellipse(hx, hy - hr * 0.35, hr * 0.9, hr * 0.7, 0, Math.PI, Math.PI * 2)
  ctx.fill()
  // soft shading on the window side
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.beginPath()
  ctx.ellipse(hx - hr * 0.35, hy + hr * 0.1, hr * 0.45, hr * 0.8, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawDesk(ctx, s) {
  const dFront = s.d - 0.48
  const dBack = s.d - 0.12
  const hw = 0.38
  quad(ctx, [
    [s.x - hw, 0.74, dBack],
    [s.x + hw, 0.74, dBack],
    [s.x + hw, 0.74, dFront],
    [s.x - hw, 0.74, dFront],
  ])
  ctx.fillStyle = '#8a7c69'
  ctx.fill()
  quad(ctx, [
    [s.x - hw, 0.74, dFront],
    [s.x + hw, 0.74, dFront],
    [s.x + hw, 0.18, dFront],
    [s.x - hw, 0.18, dFront],
  ])
  ctx.fillStyle = '#4b4339'
  ctx.fill()
  // edge highlight
  const [ax, ay] = project(s.x - hw, 0.74, dFront)
  const [bx] = project(s.x + hw, 0.74, dFront)
  ctx.fillStyle = 'rgba(255,240,220,0.18)'
  ctx.fillRect(ax, ay, bx - ax, 1.5)

  if (s.laptop) {
    quad(ctx, [
      [s.x - 0.16, 0.75, dBack - 0.05],
      [s.x + 0.16, 0.75, dBack - 0.05],
      [s.x + 0.16, 0.95, dBack - 0.08],
      [s.x - 0.16, 0.95, dBack - 0.08],
    ])
    ctx.fillStyle = '#2a2f36'
    ctx.fill()
  } else {
    quad(ctx, [
      [s.x - 0.14, 0.745, dBack - 0.06],
      [s.x + 0.1, 0.745, dBack - 0.06],
      [s.x + 0.1, 0.745, dFront + 0.1],
      [s.x - 0.14, 0.745, dFront + 0.1],
    ])
    ctx.fillStyle = '#d8d6cf'
    ctx.fill()
  }
}

function drawDetection(ctx, s, t, alpha) {
  const k = F / s.d
  const [cx, top] = project(s.x, s.height + 0.16, s.d)
  const [, bot] = project(s.x, 0.8, s.d)
  const w = 0.32 * k
  const x0 = cx - w
  const x1 = cx + w
  const color = s.unconfirmed ? '255,181,71' : '91,227,255'
  const lw = Math.max(1, k / 160)

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = `rgba(${color},0.95)`
  ctx.lineWidth = lw
  if (s.unconfirmed) {
    ctx.setLineDash([4, 4])
    ctx.lineDashOffset = -t * 12
    ctx.strokeRect(x0, top, x1 - x0, bot - top)
    ctx.setLineDash([])
  } else {
    ctx.strokeStyle = `rgba(${color},0.35)`
    ctx.strokeRect(x0, top, x1 - x0, bot - top)
    ctx.strokeStyle = `rgba(${color},1)`
    ctx.lineWidth = lw * 1.8
    const c = Math.min(14, (x1 - x0) * 0.25)
    ctx.beginPath()
    for (const [px, py, dx, dy] of [
      [x0, top, 1, 1],
      [x1, top, -1, 1],
      [x0, bot, 1, -1],
      [x1, bot, -1, -1],
    ]) {
      ctx.moveTo(px + dx * c, py)
      ctx.lineTo(px, py)
      ctx.lineTo(px, py + dy * c)
    }
    ctx.stroke()
  }
  // label — distant rows get boxes only, unless they still need confirming
  if (k < 110 && !s.unconfirmed) {
    ctx.restore()
    return
  }
  const fs = Math.max(9, Math.min(13, k / 16))
  ctx.font = `500 ${fs}px "IBM Plex Mono", monospace`
  const label = s.unconfirmed ? `TRACKING ${s.conf.toFixed(2)}` : `${s.tag} ${s.conf.toFixed(2)}`
  const tw = ctx.measureText(label).width
  ctx.fillStyle = `rgba(${color},0.92)`
  ctx.fillRect(x0, top - fs - 5, tw + 8, fs + 5)
  ctx.fillStyle = '#04070d'
  ctx.fillText(label, x0 + 4, top - 4)
  ctx.restore()
}

/**
 * Draw one frame. `reveal` (0–1) sweeps detection boxes in left→right;
 * `null` hides them entirely.
 */
export function drawClassroom(ctx, scene, t, { motion = true, reveal = null } = {}) {
  ctx.drawImage(scene.room, 0, 0)
  const byRow = [...scene.students].sort((a, b) => b.d - a.d)
  for (const s of byRow) {
    drawStudent(ctx, s, t, motion)
    drawDesk(ctx, s)
  }
  if (reveal !== null && reveal > 0) {
    for (const s of byRow) {
      const a = Math.min(1, (reveal - s.revealAt) / 0.06)
      if (a > 0) drawDetection(ctx, s, t, a)
    }
    if (reveal < 1) {
      const x = reveal * W * 1.05
      const g = ctx.createLinearGradient(x - 80, 0, x, 0)
      g.addColorStop(0, 'rgba(91,227,255,0)')
      g.addColorStop(1, 'rgba(91,227,255,0.35)')
      ctx.fillStyle = g
      ctx.fillRect(x - 80, 0, 80, H)
      ctx.fillStyle = 'rgba(91,227,255,0.9)'
      ctx.fillRect(x, 0, 1.5, H)
    }
  }
}
