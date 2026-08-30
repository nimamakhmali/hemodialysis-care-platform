// src/features/recommendations/hooks/useRecommendations.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recommendationsService } from "../services/recommendations.service";
import { QUERY_KEYS } from "@/lib/query/queryClient";
import toast from "react-hot-toast";
import type {
  ApproveRecommendationRequest,
  RejectRecommendationRequest,
} from "../types/recommendation.types";

export function usePendingRecommendations() {
  return useQuery({
    queryKey: [QUERY_KEYS.pendingRecommendations],
    queryFn: recommendationsService.getPending,
    refetchInterval: 60_000,
  });
}

export function usePendingRecommendationsCount() {
  return useQuery({
    queryKey: [QUERY_KEYS.pendingRecommendationsCount],
    queryFn: recommendationsService.getPendingCount,
    refetchInterval: 30_000,
  });
}

export function usePatientRecommendations(patientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.patientRecommendations(patientId),
    queryFn: () => recommendationsService.getPatientRecommendations(patientId),
    enabled: !!patientId,
  });
}

export function useApproveRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ApproveRecommendationRequest;
    }) => recommendationsService.approve(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.pendingRecommendations] });
      qc.invalidateQueries({
        queryKey: [QUERY_KEYS.pendingRecommendationsCount],
      });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.clinicianDashboard] });
      toast.success("توصیه با موفقیت تأیید شد");
    },
    onError: () => {
      toast.error("خطا در تأیید توصیه");
    },
  });
}

export function useRejectRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: RejectRecommendationRequest;
    }) => recommendationsService.reject(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.pendingRecommendations] });
      qc.invalidateQueries({
        queryKey: [QUERY_KEYS.pendingRecommendationsCount],
      });
      toast.success("توصیه رد شد");
    },
    onError: () => {
      toast.error("خطا در رد توصیه");
    },
  });
}