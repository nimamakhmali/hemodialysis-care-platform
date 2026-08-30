import axios, { type AxiosInstance } from 'axios'
import { setupInterceptors } from './interceptors'

// ─── Create Instance ──────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1',
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Language': 'fa',
  },
})

// ─── Setup Interceptors ───────────────────────────────────────────────────
setupInterceptors(apiClient)

export default apiClient