import { useState } from 'react'
import { DatabaseIcon, FolderIcon } from './ui/Icons'
import { Reveal, SectionHeading, Stage } from './ui/primitives'

const TABLES = [
  ['students', 'Enrolment roster'],
  ['attendance', 'Marks per session'],
  ['classes', 'Class & section map'],
  ['cameras', 'Registered feeds'],
  ['sessions', 'Lecture time windows'],
  ['analytics', 'Derived room metrics'],
]

const DIRS = [
  ['api', 'HTTP endpoints'],
  ['controllers', 'Request handling'],
  ['services', 'Stream & business logic'],
  ['models', 'Data shapes for each table'],
  ['database', 'Connections & migrations'],
  ['routes', 'URL → controller map'],
  ['utils', 'Shared helpers'],
]

// Directories that define or connect every table.
const TABLE_OWNERS = new Set(['models', 'database'])

function TreeRow({ last, active, dim, onEnter, onLeave, children }) {
  return (
    <li
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      tabIndex={0}
      className={`group flex items-center gap-3 py-2 font-mono text-[13px] transition-all duration-300 outline-none ${
        active ? 'text-ink' : dim ? 'text-mute/40' : 'text-ink/80'
      }`}
    >
      <span className="w-6 shrink-0 text-mute/60">{last ? '└──' : '├──'}</span>
      {children}
    </li>
  )
}

/** Write head: cells light in sequence as records are committed. */
function WriteBuffer() {
  return (
    <div className="flex gap-[3px]" aria-hidden>
      {Array.from({ length: 48 }, (_, i) => (
        <span
          key={i}
          className="h-3 flex-1 bg-signal/10"
          style={{ animation: `cell 3.2s ${(i * 3.2) / 48}s infinite steps(1)` }}
        />
      ))}
      <style>{`@keyframes cell { 0%{background:rgba(91,227,255,.85)} 6%{background:rgba(91,227,255,.35)} 30%,100%{background:rgba(91,227,255,.08)} }`}</style>
    </div>
  )
}

export default function DatabaseMemory() {
  const [hover, setHover] = useState(null) // { kind: 'table'|'dir', name }

  const tableActive = (name) => hover?.kind === 'table' ? hover.name === name : hover?.kind === 'dir' && TABLE_OWNERS.has(hover.name)
  const dirActive = (name) => hover?.kind === 'dir' ? hover.name === name : hover?.kind === 'table' && TABLE_OWNERS.has(name)

  return (
    <Stage id="memory" className="overflow-hidden py-32 md:py-44">
      <div className="grid-bg grid-fade absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-[1400px] px-5 md:px-12 lg:px-16 lg:pr-36">
        <SectionHeading
          eyebrow="04 · Memory"
          title={
            <>
              From raw stream
              <br />
              <span className="text-signal">to structured data</span>
            </>
          }
          sub="Server 01 receives the camera stream, manages application logic, organizes student information and maintains the data required for real-time attendance."
        />

        <Reveal delay={0.1} className="mt-16">
          <div className="mb-2 flex items-center justify-between">
            <span className="eyebrow text-[10px]">Write buffer</span>
            <span className="telemetry text-[10px] text-signal">COMMITTING</span>
          </div>
          <WriteBuffer />
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Reveal delay={0.12} className="glass brackets p-6 md:p-8" >
            <div className="mb-5 flex items-center gap-3" data-cursor="database">
              <DatabaseIcon className="h-5 w-5 text-signal" />
              <span className="font-mono text-[13px] font-semibold tracking-[0.2em] text-ink">DATABASE</span>
              <span className="telemetry ml-auto text-[10px]">6 COLLECTIONS</span>
            </div>
            <ul data-cursor="database">
              {TABLES.map(([name, desc], i) => {
                const active = tableActive(name)
                return (
                  <TreeRow
                    key={name}
                    last={i === TABLES.length - 1}
                    active={active}
                    dim={hover && !active}
                    onEnter={() => setHover({ kind: 'table', name })}
                    onLeave={() => setHover(null)}
                  >
                    <span className={`w-28 shrink-0 ${active ? 'text-signal' : ''}`}>{name}</span>
                    <span className="hidden flex-1 truncate text-[12px] text-mute sm:block">{desc}</span>
                    <span className="relative ml-auto h-1 w-16 overflow-hidden bg-line">
                      <span
                        className="absolute inset-y-0 left-0 bg-signal/70"
                        style={{ width: `${35 + ((i * 37) % 55)}%` }}
                      />
                    </span>
                  </TreeRow>
                )
              })}
            </ul>
          </Reveal>

          <Reveal delay={0.18} className="glass brackets p-6 md:p-8">
            <div className="mb-5 flex items-center gap-3" data-cursor="server">
              <FolderIcon className="h-5 w-5 text-signal" />
              <span className="font-mono text-[13px] font-semibold tracking-[0.2em] text-ink">/server</span>
              <span className="telemetry ml-auto text-[10px]">STRUCTURE ONLY</span>
            </div>
            <ul data-cursor="server">
              {DIRS.map(([name, desc], i) => {
                const active = dirActive(name)
                return (
                  <TreeRow
                    key={name}
                    last={i === DIRS.length - 1}
                    active={active}
                    dim={hover && !active}
                    onEnter={() => setHover({ kind: 'dir', name })}
                    onLeave={() => setHover(null)}
                  >
                    <span className={`w-28 shrink-0 ${active ? 'text-signal' : ''}`}>/{name}</span>
                    <span className="flex-1 truncate text-[12px] text-mute">{desc}</span>
                  </TreeRow>
                )
              })}
            </ul>
          </Reveal>
        </div>
        <p className="telemetry mt-5 text-[10px]">Hover a collection to see where it lives in the server.</p>
      </div>
    </Stage>
  )
}
