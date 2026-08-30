// src/features/messages/hooks/useMessages.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesService } from "../services/messages.service";
import { QUERY_KEYS } from "@/lib/query/queryClient";
import type { MessageFilters } from "../types/message.types";

export function useMessages(patientId: string, filters?: MessageFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.messages(patientId), filters],
    queryFn: () => messagesService.getMessages(patientId, filters),
    enabled: !!patientId,
    staleTime: 60 * 1000,
  });
}

export function useUnreadCount(patientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.unreadCount(patientId),
    queryFn: () => messagesService.getUnreadCount(patientId),
    enabled: !!patientId,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useMarkMessageRead(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => messagesService.markRead(messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.messages(patientId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount(patientId) });
    },
  });
}

export function useMarkAllRead(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => messagesService.markAllRead(patientId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.messages(patientId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount(patientId) });
    },
  });
}