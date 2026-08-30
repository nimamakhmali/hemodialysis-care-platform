// src/features/fluid-diet/hooks/useFluidLog.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fluidService } from "../services/fluid.service";
import { QUERY_KEYS } from "@/lib/query/queryClient";
import toast from "react-hot-toast";
import type { FluidLogCreateRequest } from "../types/fluid-diet.types";

export function useFluidHistory(
  patientId: string,
  params?: { days?: number }
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.fluidHistory(patientId), params],
    queryFn: () => fluidService.getHistory(patientId, params),
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useTodayFluid(patientId: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.fluidHistory(patientId), "today"],
    queryFn: () => fluidService.getToday(patientId),
    enabled: !!patientId,
    staleTime: 60 * 1000,
  });
}

export function useLogFluid(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FluidLogCreateRequest) =>
      fluidService.log(patientId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.fluidHistory(patientId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.patientDashboard(patientId) });
      toast.success("مصرف مایعات ثبت شد");
    },
    onError: () => toast.error("خطا در ثبت مایعات"),
  });
}