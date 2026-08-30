import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api.types";
import type {
  LabPanel,
  LabPanelsResponse,
  LabTrendResponse,
  ReferenceRange,
  CreateLabPanelForm,
} from "../types/lab.types";

export const labsService = {
  async getPanels(patientId: string, page = 1, size = 10): Promise<LabPanelsResponse> {
    const res = await apiClient.get<LabPanelsResponse>(
      `${API_ENDPOINTS.labs.history(patientId)}?page=${page}&size=${size}`
    );
    return res.data;
  },

  async getLatest(patientId: string): Promise<Record<string, unknown>> {
    const res = await apiClient.get<ApiResponse<Record<string, unknown>>>(
      API_ENDPOINTS.labs.latest(patientId)
    );
    return res.data.data;
  },

  async getPanelById(patientId: string, panelId: string): Promise<LabPanel> {
    const res = await apiClient.get<ApiResponse<LabPanel>>(
      API_ENDPOINTS.labs.panelDetail(patientId, panelId)
    );
    return res.data.data;
  },

  async getTrend(
    patientId: string,
    testCode: string,
    n = 6
  ): Promise<LabTrendResponse> {
    const res = await apiClient.get<ApiResponse<LabTrendResponse>>(
      `${API_ENDPOINTS.labs.trend(patientId, testCode)}?n=${n}`
    );
    return res.data.data;
  },

  async getReferenceRanges(): Promise<ReferenceRange[]> {
    const res = await apiClient.get<ApiResponse<ReferenceRange[]>>(
      API_ENDPOINTS.labs.referenceRanges
    );
    return res.data.data;
  },

  async createPanel(
    patientId: string,
    data: CreateLabPanelForm
  ): Promise<{ panel: LabPanel; warnings: string[] }> {
    const res = await apiClient.post<{
      success: boolean;
      data: LabPanel;
      cross_check_warnings: string[];
    }>(API_ENDPOINTS.labs.create(patientId), data);
    return { panel: res.data.data, warnings: res.data.cross_check_warnings ?? [] };
  },
};