/**
 * API configuration layer.
 *
 * Everything the frontend knows about the backend lives here. The visual story
 * never talks to the network directly — it goes through `src/services/camai.js`,
 * which reads this file.
 *
 *   Frontend ─▶ Server 01 API ─▶ Database
 *                    └──────────▶ Server 02 AI Engine ─▶ DGX A100
 *
 * The frontend only ever talks to Server 01. Server 02 and the DGX are reached
 * by Server 01 over its own secured channel (SSH); the browser never sees them.
 */

const env = import.meta.env

const trimSlash = (url) => (url ? url.replace(/\/+$/, '') : '')

export const API_CONFIG = {
  server01BaseUrl: trimSlash(env.VITE_SERVER01_API_URL),
  server01WsUrl: trimSlash(env.VITE_SERVER01_WS_URL),
  heroVideoUrl: env.VITE_HERO_VIDEO_URL || '',
  timeoutMs: Number(env.VITE_API_TIMEOUT_MS) || 8000,
}

/** True when a real Server 01 endpoint has been configured. */
export const isBackendConfigured = Boolean(API_CONFIG.server01BaseUrl)

/**
 * Expected Server 01 REST contract. Paths are relative to `server01BaseUrl`.
 * Adjust these to match the real Node.js routes when they're finalised.
 */
export const ENDPOINTS = {
  auth: {
    login: '/auth/login', // POST { identifier, password, remember } → { token, user }
    logout: '/auth/logout', // POST
  },
  cameras: {
    list: '/cameras', // GET → [{ id, name, room, status }]
    stream: (id) => `/cameras/${encodeURIComponent(id)}/stream`, // GET → browser-playable proxy of the RTSP feed
  },
  attendance: {
    today: '/attendance/today', // GET → { classId, enrolled, present, detected, absent, attendancePct, cameraId, recordedAt, trend? }
    byClass: (classId) => `/attendance/classes/${encodeURIComponent(classId)}`,
  },
  system: {
    status: '/system/status', // GET → { server01, server02, dgx } each { state, detail }
  },
}

/** Polling interval for dashboard data when no WebSocket is configured. */
export const POLL_INTERVAL_MS = 15000
