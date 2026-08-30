// src/features/education/hooks/useEducation.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { educationService } from "../services/education.service";
import { QUERY_KEYS } from "@/lib/query/queryClient";
import toast from "react-hot-toast";
import type {
  EducationCreateRequest,
  EducationFilters,
  EducationUpdateRequest,
} from "../types/education.types";

export function useEducation(filters?: EducationFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.education, filters],
    queryFn: () => educationService.getAll(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEducationDetail(topicCode: string) {
  return useQuery({
    queryKey: QUERY_KEYS.educationDetail(topicCode),
    queryFn: () => educationService.getByTopicCode(topicCode),
    enabled: !!topicCode,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRelevantEducation(patientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.relevantEducation(patientId),
    queryFn: () => educationService.getRelevant(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EducationCreateRequest) =>
      educationService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.education] });
      toast.success("محتوای آموزشی ایجاد شد");
    },
    onError: () => toast.error("خطا در ایجاد محتوا"),
  });
}

export function useUpdateEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EducationUpdateRequest }) =>
      educationService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.education] });
      toast.success("محتوا به‌روزرسانی شد");
    },
    onError: () => toast.error("خطا در به‌روزرسانی"),
  });
}