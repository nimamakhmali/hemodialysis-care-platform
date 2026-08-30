// src/features/dashboard/hooks/usePatientDashboard.ts
import { useQuery } from "@tanstack/react-query";
import { patientDashboardService } from "../services/patient-dashboard.service";
import { QUERY_KEYS } from "@/lib/query/queryClient";

export function usePatientDashboard(patientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.patientDashboard(patientId),
    queryFn: () => patientDashboardService.getDashboard(patientId),
    enabled: !!patientId,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}