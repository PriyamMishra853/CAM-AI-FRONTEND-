const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const CameraIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="2.5" y="7" width="13" height="10" rx="2" />
    <path d="M15.5 10.5 21 7.5v9l-5.5-3" />
    <circle cx="9" cy="12" r="2.4" />
  </svg>
)

export const ServerIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="3.5" width="17" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="17" height="7" rx="1.5" />
    <path d="M7 7h.01M7 17h.01M11 7h6M11 17h6" />
  </svg>
)

export const DatabaseIcon = (p) => (
  <svg {...base} {...p}>
    <ellipse cx="12" cy="5.5" rx="7.5" ry="2.8" />
    <path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13" />
    <path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8" />
  </svg>
)

export const GpuIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="5" y="5" width="14" height="14" rx="1.5" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M9 2v3M12 2v3M15 2v3M9 19v3M12 19v3M15 19v3M2 9h3M2 12h3M2 15h3M19 9h3M19 12h3M19 15h3" />
  </svg>
)

export const LockIcon = ({ open = false, ...p }) => (
  <svg {...base} {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <path d={open ? 'M8 10.5V7a4 4 0 0 1 7.6-1.7' : 'M8 10.5V7a4 4 0 0 1 8 0v3.5'} />
    <path d="M12 14.5v2.5" />
  </svg>
)

export const FolderIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 7.5V18a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18V9.5A1.5 1.5 0 0 0 19.5 8H12l-2-2.5H4.5A1.5 1.5 0 0 0 3 7Z" />
  </svg>
)

export const ApiIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M8 6 3 12l5 6M16 6l5 6-5 6M13.5 4l-3 16" />
  </svg>
)

export const SchemaIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="3.5" width="7" height="5" rx="1" />
    <rect x="14" y="9.5" width="7" height="5" rx="1" />
    <rect x="3" y="15.5" width="7" height="5" rx="1" />
    <path d="M10 6h2a2 2 0 0 1 2 2v4M10 18h2a2 2 0 0 0 2-2v-4" />
  </svg>
)

export const NodeIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4Z" />
    <path d="M12 8v8M9 10.5l3-2 3 2" />
  </svg>
)

export const AttendanceIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="3.5" width="16" height="17" rx="2" />
    <path d="m8 12 2.5 2.5L16 9" />
  </svg>
)

export const ChartIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" />
  </svg>
)

export const DashboardIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="8" height="10" rx="1.2" />
    <rect x="13" y="3" width="8" height="6" rx="1.2" />
    <rect x="13" y="11" width="8" height="10" rx="1.2" />
    <rect x="3" y="15" width="8" height="6" rx="1.2" />
  </svg>
)

export const BrainIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="6" cy="6" r="2" />
    <circle cx="18" cy="6" r="2" />
    <circle cx="12" cy="12" r="2.2" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
    <path d="m7.5 7.5 3 3M16.5 7.5l-3 3M7.5 16.5l3-3M16.5 16.5l-3-3" />
  </svg>
)

export const ArrowDown = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4v16M6 14l6 6 6-6" />
  </svg>
)

export const LensMark = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v5M20 9.5l-4.5 1M17 19l-3-3.5M7 19l3-3.5M4 9.5l4.5 1" />
  </svg>
)
