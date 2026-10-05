import { API_CONFIG } from '../config/api'

const TOKEN_KEY = 'camai.token'

export class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export const tokenStore = {
  get() {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token, remember) {
    try {
      const store = remember ? localStorage : sessionStorage
      store.setItem(TOKEN_KEY, token)
    } catch {
      /* storage unavailable — token lives for this page only */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
}

/** Minimal fetch wrapper for Server 01. Throws ApiError on non-2xx. */
export async function request(path, { method = 'GET', body, signal } = {}) {
  if (!API_CONFIG.server01BaseUrl) {
    throw new ApiError('Server 01 API is not configured (VITE_SERVER01_API_URL).')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs)
  signal?.addEventListener('abort', () => controller.abort())

  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const res = await fetch(`${API_CONFIG.server01BaseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: 'include',
    })
    const text = await res.text()
    const data = text ? safeJson(text) : null
    if (!res.ok) {
      throw new ApiError(data?.message || `Server 01 responded ${res.status}.`, { status: res.status, body: data })
    }
    return data
  } catch (err) {
    if (err.name === 'AbortError') throw new ApiError('Server 01 did not respond in time.')
    if (err instanceof ApiError) throw err
    throw new ApiError('Could not reach Server 01. Check the API URL and network.')
  } finally {
    clearTimeout(timer)
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}
