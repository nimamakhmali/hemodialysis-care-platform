// src/features/dialysis-sessions/services/sessions.service.ts

import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type {
  SessionFormData,
} from '../types/session.types'

export const sessionsService = {
  async getSessions(
    patientId: string,
    params?: { page?: number; size?: number }
  ) {
    const { data } = await apiClient.get(
      API_ENDPOINTS.sessions.list(patientId),
      { params }
    )
    return data
  },

  async getSession(patientId: string, sessionId: string) {
    const { data } = await apiClient.get(
      API_ENDPOINTS.sessions.detail(patientId, sessionId)
    )
    return data
  },

  async createSession(patientId: string, payload: SessionFormData) {
    const { data } = await apiClient.post(
      API_ENDPOINTS.sessions.list(patientId),
      payload
    )
    return data
  },

  async updateSession(
    patientId: string,
    sessionId: string,
    payload: Partial<SessionFormData>
  ) {
    const { data } = await apiClient.put(
      API_ENDPOINTS.sessions.detail(patientId, sessionId),
      payload
    )
    return data
  },

  async getWeightTrend(patientId: string) {
    const { data } = await apiClient.get(
      API_ENDPOINTS.sessions.weightTrend(patientId)
    )
    return data
  },

  async getBPTrend(patientId: string) {
    const { data } = await apiClient.get(
      API_ENDPOINTS.sessions.bpTrend(patientId)
    )
    return data
  },
}
