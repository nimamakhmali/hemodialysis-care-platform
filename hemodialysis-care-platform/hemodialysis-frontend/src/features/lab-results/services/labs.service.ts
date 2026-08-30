// src/features/lab-results/services/labs.service.ts
import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { CreateLabPanelForm } from '../types/lab.types'

export const labsService = {
  async getLatestLabs(patientId: string) {
    const { data } = await apiClient.get(API_ENDPOINTS.labs.latest(patientId))
    return data
  },

  async createPanel(patientId: string, payload: CreateLabPanelForm) {
    const { data } = await apiClient.post(API_ENDPOINTS.labs.create(patientId), payload)
    return data
  },

  async getHistory(patientId: string, params?: { page?: number; size?: number; test_code?: string }) {
    const { data } = await apiClient.get(API_ENDPOINTS.labs.history(patientId), { params })
    return data
  },

  async getPanelDetail(patientId: string, panelId: string) {
    const { data } = await apiClient.get(API_ENDPOINTS.labs.panelDetail(patientId, panelId))
    return data
  },

  async getTrend(patientId: string, testCode: string) {
    const { data } = await apiClient.get(API_ENDPOINTS.labs.trend(patientId, testCode))
    return data
  },

  async getReferenceRanges() {
    const { data } = await apiClient.get(API_ENDPOINTS.labs.referenceRanges)
    return data
  },
}