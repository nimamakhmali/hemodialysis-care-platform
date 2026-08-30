// src/features/symptoms/hooks/useSymptoms.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { symptomsService } from "../services/symptoms.service";
import { QUERY_KEYS } from "@/lib/query/queryClient";
import toast from "react-hot-toast";
import type {
  SymptomReportCreateRequest,
  SymptomFilters,
} from "../types/symptom.types";

export function useSymptomHistory(
  patientId: string,
  filters?: SymptomFilters
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.symptoms(patientId), filters],
    queryFn: () => symptomsService.getHistory(patientId, filters),
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSymptomSummary(patientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.symptomSummary(patientId),
    queryFn: () => symptomsService.getSummary(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSymptomReport(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SymptomReportCreateRequest) =>
      symptomsService.create(patientId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.symptoms(patientId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.symptomSummary(patientId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.patientDashboard(patientId) });
      toast.success("علائم شما با موفقیت ثبت شد");
    },
    onError: () => toast.error("خطا در ثبت علائم"),
  });
}