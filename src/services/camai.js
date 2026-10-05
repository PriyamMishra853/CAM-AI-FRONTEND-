/**
 * Real backend integration. Every function here calls Server 01 and nothing
 * else — no mock fallbacks hide inside. Demo data lives in `src/mocks/` and is
 * chosen explicitly by `useSystemData` when the backend isn't configured.
 */
import { ENDPOINTS, isBackendConfigured } from '../config/api'
import { request, tokenStore } from './http'

export { isBackendConfigured }

export async function login({ identifier, password, remember }) {
  const data = await request(ENDPOINTS.auth.login, {
    method: 'POST',
    body: { identifier, password, remember },
  })
  if (data?.token) tokenStore.set(data.token, remember)
  return data
}

export async function logout() {
  try {
    await request(ENDPOINTS.auth.logout, { method: 'POST' })
  } finally {
    tokenStore.clear()
  }
}

export const getCameras = (opts) => request(ENDPOINTS.cameras.list, opts)
export const getAttendanceToday = (opts) => request(ENDPOINTS.attendance.today, opts)
export const getSystemStatus = (opts) => request(ENDPOINTS.system.status, opts)
