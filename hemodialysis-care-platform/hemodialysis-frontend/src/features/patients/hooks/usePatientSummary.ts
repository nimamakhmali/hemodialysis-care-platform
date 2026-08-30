"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api.types";
import type { PatientDetail } from "../types/patient.types";
import { PATIENT_KEYS } from "./usePatients";

export function usePatientSummary(id: string) {
  return useQuery({
    queryKey: [...PATIENT_KEYS.detail(id), "summary"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PatientDetail["summary"]>>(
        API_ENDPOINTS.patients.summary(id)
      );
      return res.data.data;
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}