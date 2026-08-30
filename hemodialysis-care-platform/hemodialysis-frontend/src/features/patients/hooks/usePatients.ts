"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { patientsService } from "../services/patients.service";
import type {
  PatientFilters,
  CreatePatientForm,
  UpdatePatientForm,
} from "../types/patient.types";
import { toast } from "react-hot-toast";

export const PATIENT_KEYS = {
  all: ["patients"] as const,
  lists: () => [...PATIENT_KEYS.all, "list"] as const,
  list: (filters: PatientFilters, page: number, size: number) =>
    [...PATIENT_KEYS.lists(), filters, page, size] as const,
  details: () => [...PATIENT_KEYS.all, "detail"] as const,
  detail: (id: string) => [...PATIENT_KEYS.details(), id] as const,
  timeline: (id: string) => [...PATIENT_KEYS.detail(id), "timeline"] as const,
};

export function usePatients(
  filters: PatientFilters = {},
  page = 1,
  size = 12
) {
  const debouncedSearch = useDebounce(filters.search ?? "", 300);
  const effectiveFilters = { ...filters, search: debouncedSearch };

  return useQuery({
    queryKey: PATIENT_KEYS.list(effectiveFilters, page, size),
    queryFn: () => patientsService.getAll(effectiveFilters, page, size),
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: PATIENT_KEYS.detail(id),
    queryFn: () => patientsService.getById(id),
    enabled: Boolean(id),
    staleTime: 3 * 60 * 1000,
  });
}

export function usePatientTimeline(id: string, limit = 30) {
  return useQuery({
    queryKey: PATIENT_KEYS.timeline(id),
    queryFn: () => patientsService.getTimeline(id, limit),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePatientForm) => patientsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PATIENT_KEYS.lists() });
      toast.success("بیمار با موفقیت ایجاد شد");
    },
    onError: () => toast.error("خطا در ایجاد بیمار"),
  });
}

export function useUpdatePatient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePatientForm) => patientsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PATIENT_KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: PATIENT_KEYS.lists() });
      toast.success("اطلاعات به‌روز شد");
    },
    onError: () => toast.error("خطا در ویرایش"),
  });
}