// src/features/alerts/hooks/useAlerts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsService } from "../services/alerts.service";
import { QUERY_KEYS } from "@/lib/query/queryClient";
import toast from "react-hot-toast";
import type { AlertFilters } from "../types/alert.types";

export function useAlerts(filters?: AlertFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.alerts, filters],
    queryFn: () => alertsService.getAll(filters),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function usePatientAlerts(
  patientId: string,
  filters?: Omit<AlertFilters, "patient_id">
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.patientAlerts(patientId), filters],
    queryFn: () => alertsService.getPatientAlerts(patientId, filters),
    enabled: !!patientId,
    refetchInterval: 60_000,
  });
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, note }: { alertId: string; note?: string }) =>
      alertsService.acknowledge(alertId, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.alerts] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.clinicianDashboard] });
      toast.success("هشدار تأیید شد");
    },
    onError: () => toast.error("خطا در تأیید هشدار"),
  });
}

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      alertId,
      note,
    }: {
      alertId: string;
      note?: string;
    }) => alertsService.resolve(alertId, { resolution_note: note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.alerts] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.clinicianDashboard] });
      toast.success("هشدار بسته شد");
    },
    onError: () => toast.error("خطا در بستن هشدار"),
  });
}