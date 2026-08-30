import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api.types";
import type {
  DialysisSession,
  SessionsResponse,
  WeightTrend,
  BPTrend,
  CreateSessionForm,
  SessionFilters,
} from "../types/session.types";

export const sessionsService = {
  async getAll(
    patientId: string,
    filters: SessionFilters = {}
  ): Promise<SessionsResponse> {
    const params = new URLSearchParams();
    if (filters.from_date) params.set("from_date", filters.from_date);
    if (filters.to_date) params.set("to_date", filters.to_date);
    params.set("page", String(filters.page ?? 1));
    params.set("size", String(filters.size ?? 20));

    const res = await apiClient.get<SessionsResponse>(
      `${API_ENDPOINTS.sessions.list(patientId)}?${params.toString()}`
    );
    return res.data;
  },

  async getById(patientId: string, sessionId: string): Promise<DialysisSession> {
    const res = await apiClient.get<ApiResponse<DialysisSession>>(
      API_ENDPOINTS.sessions.detail(patientId, sessionId)
    );
    return res.data.data;
  },

  async create(
    patientId: string,
    data: CreateSessionForm
  ): Promise<{ data: DialysisSession; warnings: string[] }> {
    const res = await apiClient.post<{
      success: boolean;
      data: DialysisSession;
      warnings: string[];
    }>(API_ENDPOINTS.sessions.create(patientId), data);
    return { data: res.data.data, warnings: res.data.warnings ?? [] };
  },

  async update(
    patientId: string,
    sessionId: string,
    data: Partial<CreateSessionForm>
  ): Promise<DialysisSession> {
    const res = await apiClient.put<ApiResponse<DialysisSession>>(
      API_ENDPOINTS.sessions.update(patientId, sessionId),
      data
    );
    return res.data.data;
  },

  async getWeightTrend(patientId: string, n = 8): Promise<WeightTrend> {
    const res = await apiClient.get<ApiResponse<WeightTrend>>(
      `${API_ENDPOINTS.sessions.weightTrend(patientId)}?n=${n}`
    );
    return res.data.data;
  },

  async getBPTrend(patientId: string, n = 8): Promise<BPTrend> {
    const res = await apiClient.get<ApiResponse<BPTrend>>(
      `${API_ENDPOINTS.sessions.bpTrend(patientId)}?n=${n}`
    );
    return res.data.data;
  },
};