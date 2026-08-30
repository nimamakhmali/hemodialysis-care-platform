import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { API_ENDPOINTS } from './endpoints'

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token!)
  })
  failedQueue = []
}

export function setupInterceptors(instance: AxiosInstance): void {
  // ─── Request Interceptor ──────────────────────────────────────────────
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // Request ID for tracing
      if (config.headers) {
        config.headers['X-Request-ID'] = crypto.randomUUID()
      }

      return config
    },
    (error) => Promise.reject(error)
  )

  // ─── Response Interceptor ─────────────────────────────────────────────
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean
      }

      // Handle 401 — Token expired
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        originalRequest.url !== API_ENDPOINTS.auth.login &&
        originalRequest.url !== API_ENDPOINTS.auth.refresh
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              return instance(originalRequest)
            })
            .catch((err) => Promise.reject(err))
        }

        originalRequest._retry = true
        isRefreshing = true

        const refreshToken =
          typeof window !== 'undefined'
            ? localStorage.getItem('refresh_token')
            : null

        if (!refreshToken) {
          processQueue(error, null)
          isRefreshing = false
          redirectToLogin()
          return Promise.reject(error)
        }

        try {
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.auth.refresh}`,
            { refresh_token: refreshToken }
          )

          const newToken = data.data.access_token
          localStorage.setItem('access_token', newToken)

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }

          processQueue(null, newToken)
          return instance(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          redirectToLogin()
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }

      // Handle 403 — Forbidden
      if (error.response?.status === 403) {
        console.error('[API] Access forbidden:', originalRequest.url)
      }

      // Handle 500 — Server Error
      if (error.response?.status && error.response.status >= 500) {
        console.error('[API] Server error:', error.response.status)
      }

      return Promise.reject(error)
    }
  )
}

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = '/login'
  }
}