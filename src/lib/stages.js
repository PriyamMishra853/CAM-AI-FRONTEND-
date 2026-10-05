/** The story's signal path. Order is the order a frame travels. */
export const STAGES = [
  { id: 'classroom', label: 'Classroom' },
  { id: 'camera', label: 'Camera' },
  { id: 'rtsp', label: 'RTSP' },
  { id: 'server-01', label: 'Server 01' },
  { id: 'memory', label: 'Memory' },
  { id: 'server-02', label: 'Server 02' },
  { id: 'ai-compute', label: 'AI compute' },
  { id: 'secure-link', label: 'SSH' },
  { id: 'dgx', label: 'DGX A100' },
  { id: 'result', label: 'Result' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'architecture', label: 'Architecture' },
]

export function scrollToStage(id) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}
