import { useState } from 'react'
import { API_CONFIG } from '../config/api'
import { isBackendConfigured, login } from '../services/camai'
import { LensMark } from './ui/Icons'

function Field({ id, label, children }) {
  return (
    <div className="group relative">
      <label htmlFor={id} className="eyebrow mb-2 block text-[10px] group-focus-within:text-signal">
        {label}
      </label>
      {children}
      <span className="pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-signal transition-transform duration-500 group-focus-within:scale-x-100" />
    </div>
  )
}

const inputCls =
  'w-full border-0 border-b border-line-strong bg-transparent px-0 pb-2.5 pt-1 font-mono text-[15px] text-ink placeholder:text-mute/50 focus:outline-none focus-visible:outline-none'

/**
 * Institutional sign-in. Talks to Server 01 only when it is configured;
 * otherwise it says so plainly instead of pretending to authenticate.
 */
export default function LoginPanel({ onSignedIn }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPw, setShowPw] = useState(false)
  const [status, setStatus] = useState({ kind: 'idle', message: '' })

  const host = (() => {
    try {
      return new URL(API_CONFIG.server01BaseUrl).host
    } catch {
      return API_CONFIG.server01BaseUrl
    }
  })()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!identifier.trim() || !password) {
      setStatus({ kind: 'error', message: 'Enter your email or institutional ID and password.' })
      return
    }
    if (!isBackendConfigured) {
      setStatus({
        kind: 'notice',
        message: 'Sign-in needs Server 01, which isn’t connected yet. Scroll on to explore the system preview on demo data.',
      })
      return
    }
    setStatus({ kind: 'pending', message: 'Verifying with Server 01…' })
    try {
      const data = await login({ identifier: identifier.trim(), password, remember })
      setPassword('')
      setStatus({ kind: 'success', message: `Signed in${data?.user?.name ? ` as ${data.user.name}` : ''}.` })
      onSignedIn?.(data)
    } catch (err) {
      setStatus({ kind: 'error', message: err.message })
    }
  }

  const tone = {
    idle: 'text-mute',
    pending: 'text-signal',
    success: 'text-signal',
    notice: 'text-tally',
    error: 'text-tally',
  }[status.kind]

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="login-title"
      className="glass brackets relative w-full max-w-[400px] bg-abyss/85! p-7 md:p-8"
    >
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center border border-signal/40 text-signal">
            <LensMark width={18} height={18} />
          </span>
          <span className="eyebrow text-[10px] leading-snug">Secure institutional access</span>
        </div>
        <span className="telemetry flex items-center gap-1.5 text-[10px]">
          <span className={`h-1.5 w-1.5 rounded-full ${isBackendConfigured ? 'bg-signal' : 'bg-tally'}`} />
          {isBackendConfigured ? 'S01 READY' : 'PREVIEW'}
        </span>
      </div>

      <h2 id="login-title" className="display-soft mb-7 text-[1.6rem] text-ink">
        Control room sign-in
      </h2>

      <div className="space-y-6">
        <Field id="login-id" label="Email or institutional ID">
          <input
            id="login-id"
            name="identifier"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="name@institution.edu"
            className={inputCls}
          />
        </Field>
        <Field id="login-pw" label="Password">
          <div className="flex items-end gap-3">
            <input
              id="login-pw"
              name="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="telemetry shrink-0 pb-2.5 text-[10px] hover:text-signal"
              aria-pressed={showPw}
            >
              {showPw ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </Field>
      </div>

      <label className="mt-6 flex w-fit items-center gap-3 text-sm text-mute">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="peer sr-only"
        />
        <span className="flex h-4 w-4 items-center justify-center border border-line-strong transition-colors peer-checked:border-signal peer-checked:bg-signal/15 peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-signal">
          {remember && <span className="h-1.5 w-1.5 bg-signal" />}
        </span>
        Remember me on this device
      </label>

      <button
        type="submit"
        disabled={status.kind === 'pending'}
        className="mt-8 flex w-full items-center justify-between border border-signal/60 bg-signal/10 px-5 py-3.5 font-mono text-[12px] font-medium tracking-[0.22em] text-signal uppercase transition-all duration-300 hover:bg-signal hover:text-void disabled:opacity-60"
      >
        {status.kind === 'pending' ? 'Verifying…' : 'Log in'}
        <span aria-hidden>→</span>
      </button>

      <p role="status" aria-live="polite" className={`mt-4 min-h-[2.5rem] text-[13px] leading-snug ${tone}`}>
        {status.message}
      </p>

      <div className="telemetry mt-2 flex items-center justify-between border-t border-line pt-4 text-[10px]">
        <span>SERVER 01</span>
        <span className="truncate pl-4">{isBackendConfigured ? host : 'NOT CONNECTED'}</span>
      </div>
    </form>
  )
}
