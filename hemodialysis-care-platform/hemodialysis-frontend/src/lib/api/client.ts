import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Token management ────────────────────────────────────────────────────────
export const tokenManager = {
  getAccess: () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null,
  getRefresh: () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('refresh_token')
      : null,
  setTokens: (access: string, refresh?: string) => {
    if (typeof window === 'undefined') return
    localStorage.setItem('access_token', access)
    if (refresh) localStorage.setItem('refresh_token', refresh)
    // Cookie for middleware
    const expires = new Date()
    expires.setHours(expires.getHours() + 24)
    document.cookie = `access_token=${access};expires=${expires.toUTCString()};path=/;SameSite=Strict`
  },
  clearTokens: () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    document.cookie =
      'access_token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/'
  },
}

// ── Request interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccess()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor ────────────────────────────────────────────────────
let isRefreshing = false
let queue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(token: string | null, error: unknown = null) {
  queue.forEach(({ resolve, reject }) => {
    if (token) resolve(token)
    else reject(error)
  })
  queue = []
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`
              resolve(apiClient(original))
            },
            reject,
          })
        })
      }

      original._retry = true
      isRefreshing = true

      const refreshToken = tokenManager.getRefresh()

      if (!refreshToken) {
        isRefreshing = false
        tokenManager.clearTokens()
        if (typeof window !== 'undefined')
          window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const newAccess: string =
          res.data?.access_token ?? res.data?.data?.access_token

        if (!newAccess) throw new Error('No token in refresh response')

        tokenManager.setTokens(
          newAccess,
          res.data?.refresh_token ?? refreshToken
        )
        processQueue(newAccess)
        isRefreshing = false

        original.headers.Authorization = `Bearer ${newAccess}`
        return apiClient(original)
      } catch (refreshError) {
        processQueue(null, refreshError)
        isRefreshing = false
        tokenManager.clearTokens()
        if (typeof window !== 'undefined')
          window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient