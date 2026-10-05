import { createContext, useContext, useEffect, useState } from 'react'
import { POLL_INTERVAL_MS } from '../config/api'
import { getAttendanceToday, getCameras, getSystemStatus, isBackendConfigured } from '../services/camai'
import { DEMO_ATTENDANCE, DEMO_CAMERAS, DEMO_SYSTEM, DEMO_TREND } from '../mocks/demoData'

const DEMO = {
  cameras: DEMO_CAMERAS,
  attendance: DEMO_ATTENDANCE,
  system: DEMO_SYSTEM,
  trend: DEMO_TREND,
}

/**
 * Single source for dashboard data.
 *  source: 'demo'    → backend not configured, showing visualization data
 *  source: 'loading' → backend configured, first fetch in flight
 *  source: 'live'    → last fetch from Server 01 succeeded
 *  source: 'error'   → backend configured but unreachable (no silent demo fallback)
 */
export function useSystemData() {
  const [state, setState] = useState(() =>
    isBackendConfigured
      ? { source: 'loading', data: null, error: null }
      : { source: 'demo', data: DEMO, error: null },
  )

  useEffect(() => {
    if (!isBackendConfigured) return
    const controller = new AbortController()
    let timer

    const load = async () => {
      try {
        const [cameras, attendance, system] = await Promise.all([
          getCameras({ signal: controller.signal }),
          getAttendanceToday({ signal: controller.signal }),
          getSystemStatus({ signal: controller.signal }),
        ])
        setState({
          source: 'live',
          data: { cameras, attendance, system, trend: attendance?.trend ?? [] },
          error: null,
        })
      } catch (error) {
        if (!controller.signal.aborted) setState((s) => ({ ...s, source: 'error', error }))
      }
      if (!controller.signal.aborted) timer = setTimeout(load, POLL_INTERVAL_MS)
    }
    load()
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [])

  return state
}

const SystemDataContext = createContext(null)

/** Fetch once at the top of the app; every section reads the same state. */
export function SystemDataProvider({ children }) {
  const state = useSystemData()
  return <SystemDataContext.Provider value={state}>{children}</SystemDataContext.Provider>
}

export const useData = () => useContext(SystemDataContext)
