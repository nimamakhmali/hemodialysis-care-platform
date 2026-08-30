// src/features/dashboard/hooks/useClinicianDashboard.ts
import { useQuery } from "@tanstack/react-query";
import { clinicianDashboardService } from "../services/clinician-dashboard.service";
import { QUERY_KEYS } from "@/lib/query/queryClient";

export function useClinicianDashboard() {
  return useQuery({
    queryKey: [QUERY_KEYS.clinicianDashboard],
    queryFn: clinicianDashboardService.getDashboard,
    refetchInterval: 60_000, // هر ۶۰ ثانیه
    staleTime: 30_000,
  });
}

export function usePatientsOverview(params?: {
  page?: number;
  size?: number;
  sort_by?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.clinicianPatientsOverview, params],
    queryFn: () => clinicianDashboardService.getPatientsOverview(params),
    staleTime: 30_000,
  });
}