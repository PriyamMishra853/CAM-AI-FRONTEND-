/**
 * DEMO DATA — visualization only.
 *
 * Used when VITE_SERVER01_API_URL is not set. Shapes mirror the Server 01
 * contract documented in `src/config/api.js`, so swapping to live data needs
 * no component changes. Contains no real student information.
 */

export const DEMO_CAMERAS = [
  { id: 'CAM-01', name: 'Camera 01', room: 'CSE — 2A', status: 'online' },
  { id: 'CAM-02', name: 'Camera 02', room: 'CSE — 2B', status: 'online' },
  { id: 'CAM-03', name: 'Camera 03', room: 'ECE — 3A', status: 'online' },
]

export const DEMO_ATTENDANCE = {
  classId: 'CSE — 2A',
  enrolled: 44,
  present: 42,
  detected: 40,
  absent: 2,
  attendancePct: 95.2,
  cameraId: 'CAM-01',
}

export const DEMO_SYSTEM = {
  server01: { state: 'online', detail: 'Node.js · DB connected' },
  server02: { state: 'online', detail: 'AI engine · pipeline ready' },
  dgx: { state: 'active', detail: '8 × A100 · inference' },
}

/** Hourly attendance curve for the dashboard sparkline (percent). */
export const DEMO_TREND = [88.1, 90.4, 93.0, 94.6, 95.2, 94.8, 95.2]
