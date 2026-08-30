"use client";

import { useQuery } from "@tanstack/react-query";
import { alertsService } from "../services/alerts.service";
import type { AlertFilters } from "../types/alert.types";

export const PATIENT_ALERT_KEYS = {
  all: (patientId: string) => ["patient-alerts", patientId] as const,
  list: (patientId: string, filters: AlertFilters) =>
    [...PATIENT_ALERT_KEYS.all(patientId), filters] as const,
};

export function usePatientAlerts(
  patientId: string,
  filters: Omit<AlertFilters, "patient_id"> = {}
) {
  return useQuery({
    queryKey: PATIENT_ALERT_KEYS.list(patientId, filters),
    queryFn: () => alertsService.getPatientAlerts(patientId, filters),
    enabled: Boolean(patientId),
    staleTime: 60 * 1000,
    refetchInterval: 90 * 1000,
  });
}