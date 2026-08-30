import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, PaginatedApiResponse } from "@/types/api.types";
import type {
  Patient,
  PatientSummary,
  PatientDetail,
  CreatePatientForm,
  UpdatePatientForm,
  PatientFilters,
  TimelineEvent,
} from "../types/patient.types";

export const patientsService = {
  async getAll(
    filters: PatientFilters = {},
    page = 1,
    size = 12
  ): Promise<PaginatedApiResponse<PatientSummary>> {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.status && filters.status !== "all")
      params.set("is_active", String(filters.status === "active"));
    if (filters.has_active_alerts) params.set("has_active_alerts", "true");
    if (filters.no_recent_data) params.set("no_recent_data", "true");
    if (filters.sort_by) params.set("sort_by", filters.sort_by);
    if (filters.sort_order) params.set("sort_order", filters.sort_order);
    params.set("page", String(page));
    params.set("size", String(size));

    const res = await apiClient.get<PaginatedApiResponse<PatientSummary>>(
      `${API_ENDPOINTS.patients.list}?${params.toString()}`
    );
    return res.data;
  },

  async getById(id: string): Promise<PatientDetail> {
    const res = await apiClient.get<ApiResponse<PatientDetail>>(
      API_ENDPOINTS.patients.detail(id)
    );
    return res.data.data;
  },

  async create(data: CreatePatientForm): Promise<Patient> {
    const res = await apiClient.post<ApiResponse<Patient>>(
      API_ENDPOINTS.patients.create,
      data
    );
    return res.data.data;
  },

  async update(id: string, data: UpdatePatientForm): Promise<Patient> {
    const res = await apiClient.put<ApiResponse<Patient>>(
      API_ENDPOINTS.patients.update(id),
      data
    );
    return res.data.data;
  },

  async deactivate(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.patients.deactivate(id));
  },

  async getTimeline(id: string, limit = 30): Promise<TimelineEvent[]> {
    const res = await apiClient.get<ApiResponse<TimelineEvent[]>>(
      `${API_ENDPOINTS.patients.timeline(id)}?limit=${limit}`
    );
    return res.data.data;
  },
};