"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsService } from "../services/alerts.service";
import type { AlertFilters } from "../types/alert.types";
import { toast } from "react-hot-toast";

export const ALERT_KEYS = {
  all: ["alerts"] as const,
  lists: () => [...ALERT_KEYS.all, "list"] as const,
  list: (filters: AlertFilters) => [...ALERT_KEYS.lists(), filters] as const,
};

export function useAlerts(filters: AlertFilters = {}) {
  return useQuery({
    queryKey: ALERT_KEYS.list(filters),
    queryFn: () => alertsService.getAll(filters),
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, note }: { alertId: string; note?: string }) =>
      alertsService.acknowledge(alertId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ALERT_KEYS.all });
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
    }) => alertsService.resolve(alertId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ALERT_KEYS.all });
      toast.success("هشدار بسته شد");
    },
    onError: () => toast.error("خطا"),
  });
}