// src/services/api.js
import axios from 'axios'
import { ENV } from '@/config/env'
import { useAuthStore } from '@/store/authStore'

// ── Base instance ──────────────────────────────────────────────────────────
const api = axios.create({
  baseURL:         ENV.API_BASE_URL,
  headers:         { 
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  timeout:         15000,
  withCredentials: true,   // send HTTP-only refresh-token cookie automatically
})

// ── Token refresh state ────────────────────────────────────────────────────
// Prevents multiple simultaneous refresh calls when several requests 401 at once.
let isRefreshing = false
let failedQueue  = []   // Array<{ resolve, reject }>

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  failedQueue = []
}

// ── Shared silent-refresh helper ───────────────────────────────────────────
// Used by both the reactive 401 interceptor AND the proactive timer in authStore.
export async function doSilentRefresh() {
  const storedRefreshToken = useAuthStore.getState().refreshToken

  const refreshResponse = await axios.post(
    `${ENV.API_BASE_URL}/auth/refresh-token`,
    storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
    {
      withCredentials: true,
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    }
  )

  // Unwrap ApiResponse<AuthResponse>
  const authData = refreshResponse.data?.data ?? refreshResponse.data

  const newAccessToken  = authData.accessToken
  const newRefreshToken = authData.refreshToken

  // Persist tokens and restart the proactive timer
  useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken, doSilentRefresh)

  // Keep default header in sync
  api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`

  return newAccessToken
}

// ── Request interceptor - attach Bearer token ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor - unwrap ApiResponse + silent refresh ─────────────
api.interceptors.response.use(

  // ✅ Success: unwrap the ApiResponse<T> envelope → return the `data` field
  (response) => response.data,

  // ❌ Error
  async (error) => {
    const originalRequest = error.config
    const status          = error.response?.status

    // Only intercept 401s that aren't already retried or from auth endpoints
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/refresh-token') ||
      originalRequest.url?.includes('/auth/login')

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {

      // ── Another refresh is already in progress → queue this request ───────
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        })
      }

      // ── Start refresh ──────────────────────────────────────────────────────
      originalRequest._retry = true
      isRefreshing            = true

      try {
        const newAccessToken = await doSilentRefresh()

        // Drain the queue - all waiting requests get the new token
        processQueue(null, newAccessToken)

        // Retry the original failed request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)

      } catch (refreshError) {
        // Refresh itself failed → drain queue with error, force logout
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        window.location.replace('/login')
        return Promise.reject(refreshError)

      } finally {
        isRefreshing = false
      }
    }

    // All other errors: normalize and reject with backend error shape
    return Promise.reject(error.response?.data ?? error)
  }
)

export default api