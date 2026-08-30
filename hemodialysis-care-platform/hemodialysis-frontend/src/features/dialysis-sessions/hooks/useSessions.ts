"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsService } from "../services/sessions.service";
import type { CreateSessionForm, SessionFilters } from "../types/session.types";
import { toast } from "react-hot-toast";

export const SESSION_KEYS = {
  all: (patientId: string) => ["sessions", patientId] as const,
  list: (patientId: string, filters: SessionFilters) =>
    [...SESSION_KEYS.all(patientId), "list", filters] as const,
  detail: (patientId: string, sessionId: string) =>
    [...SESSION_KEYS.all(patientId), sessionId] as const,
  weightTrend: (patientId: string, n: number) =>
    [...SESSION_KEYS.all(patientId), "weight-trend", n] as const,
  bpTrend: (patientId: string, n: number) =>
    [...SESSION_KEYS.all(patientId), "bp-trend", n] as const,
};

export function useSessions(patientId: string, filters: SessionFilters = {}) {
  return useQuery({
    queryKey: SESSION_KEYS.list(patientId, filters),
    queryFn: () => sessionsService.getAll(patientId, filters),
    enabled: Boolean(patientId),
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
  });
}

export function useWeightTrend(patientId: string, n = 8) {
  return useQuery({
    queryKey: SESSION_KEYS.weightTrend(patientId, n),
    queryFn: () => sessionsService.getWeightTrend(patientId, n),
    enabled: Boolean(patientId),
    staleTime: 3 * 60 * 1000,
  });
}

export function useBPTrend(patientId: string, n = 8) {
  return useQuery({
    queryKey: SESSION_KEYS.bpTrend(patientId, n),
    queryFn: () => sessionsService.getBPTrend(patientId, n),
    enabled: Boolean(patientId),
    staleTime: 3 * 60 * 1000,
  });
}

export function useCreateSession(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSessionForm) =>
      sessionsService.create(patientId, data),
    onSuccess: ({ warnings }) => {
      qc.invalidateQueries({ queryKey: SESSION_KEYS.all(patientId) });
      qc.invalidateQueries({ queryKey: ["patients"] });
      if (warnings.length > 0) {
        warnings.forEach((w) => toast(w, { icon: "⚠️" }));
      }
      toast.success("جلسه دیالیز ثبت شد");
    },
    onError: () => toast.error("خطا در ثبت جلسه"),
  });
}