import { useData } from '../../hooks/useSystemData'

const COPY = {
  demo: { label: 'Demo data', tone: 'border-tally/50 text-tally', title: 'Server 01 is not configured. Set VITE_SERVER01_API_URL to show live data.' },
  loading: { label: 'Connecting to Server 01', tone: 'border-signal/40 text-signal', title: '' },
  live: { label: 'Live · Server 01', tone: 'border-signal/50 text-signal', title: '' },
  error: { label: 'Server 01 unreachable', tone: 'border-tally/60 text-tally', title: '' },
}

/** Always tells the viewer whether numbers on screen are real. */
export default function DataSourceBadge({ className = '' }) {
  const { source, error } = useData()
  const c = COPY[source]
  return (
    <span
      title={error?.message || c.title}
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] tracking-[0.16em] uppercase ${c.tone} ${className}`}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {c.label}
    </span>
  )
}
