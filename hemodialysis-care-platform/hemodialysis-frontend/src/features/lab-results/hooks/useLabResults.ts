"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { labsService } from "../services/labs.service";
import type { CreateLabPanelForm } from "../types/lab.types";
import { toast } from "react-hot-toast";

export const LAB_KEYS = {
  all: (patientId: string) => ["labs", patientId] as const,
  panels: (patientId: string, page: number) =>
    [...LAB_KEYS.all(patientId), "panels", page] as const,
  latest: (patientId: string) => [...LAB_KEYS.all(patientId), "latest"] as const,
  trend: (patientId: string, code: string, n: number) =>
    [...LAB_KEYS.all(patientId), "trend", code, n] as const,
  refs: ["lab-refs"] as const,
};

export function useLabPanels(patientId: string, page = 1) {
  return useQuery({
    queryKey: LAB_KEYS.panels(patientId, page),
    queryFn: () => labsService.getPanels(patientId, page),
    enabled: Boolean(patientId),
    placeholderData: (prev) => prev,
    staleTime: 3 * 60 * 1000,
  });
}

export function useLatestLabs(patientId: string) {
  return useQuery({
    queryKey: LAB_KEYS.latest(patientId),
    queryFn: () => labsService.getLatest(patientId),
    enabled: Boolean(patientId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLabTrend(patientId: string, testCode: string, n = 6) {
  return useQuery({
    queryKey: LAB_KEYS.trend(patientId, testCode, n),
    queryFn: () => labsService.getTrend(patientId, testCode, n),
    enabled: Boolean(patientId) && Boolean(testCode),
    staleTime: 5 * 60 * 1000,
  });
}

export function useReferenceRanges() {
  return useQuery({
    queryKey: LAB_KEYS.refs,
    queryFn: labsService.getReferenceRanges,
    staleTime: 30 * 60 * 1000,
  });
}

export function useCreateLabPanel(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLabPanelForm) =>
      labsService.createPanel(patientId, data),
    onSuccess: ({ warnings }) => {
      qc.invalidateQueries({ queryKey: LAB_KEYS.all(patientId) });
      qc.invalidateQueries({ queryKey: ["patients"] });
      if (warnings.length) warnings.forEach((w) => toast(w, { icon: "⚠️" }));
      toast.success("پنل آزمایش ثبت شد");
    },
    onError: () => toast.error("خطا در ثبت آزمایش"),
  });
}