// src/features/fluid-diet/services/fluid.service.ts
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  FluidLog,
  FluidLogCreateRequest,
  FluidHistory,
} from "../types/fluid-diet.types";

export const fluidService = {
  log: async (
    patientId: string,
    data: FluidLogCreateRequest
  ): Promise<FluidLog> => {
    const res = await apiClient.post(
      API_ENDPOINTS.fluid.log(patientId),
      data
    );
    return res.data?.data ?? res.data;
  },

  getHistory: async (
    patientId: string,
    params?: { days?: number; page?: number; size?: number }
  ): Promise<FluidLog[]> => {
    const res = await apiClient.get(
      API_ENDPOINTS.fluid.history(patientId),
      { params }
    );
    return res.data?.data ?? res.data ?? [];
  },

  getToday: async (patientId: string): Promise<FluidLog | null> => {
    const today = new Date().toISOString().split("T")[0];
    const res = await apiClient.get(
      API_ENDPOINTS.fluid.history(patientId),
      { params: { date: today } }
    );
    const arr: FluidLog[] = res.data?.data ?? res.data ?? [];
    return arr.find((l) => l.log_date === today) ?? null;
  },
};