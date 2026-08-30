// src/features/messages/services/messages.service.ts
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { PatientMessage, MessageFilters } from "../types/message.types";

export const messagesService = {
  getMessages: async (
    patientId: string,
    filters?: MessageFilters
  ): Promise<PatientMessage[]> => {
    const res = await apiClient.get(
      API_ENDPOINTS.messages.list(patientId),
      { params: filters }
    );
    return res.data?.data ?? res.data ?? [];
  },

  markRead: async (messageId: string): Promise<void> => {
    await apiClient.put(API_ENDPOINTS.messages.read(messageId));
  },

  markAllRead: async (patientId: string): Promise<void> => {
    await apiClient.put(API_ENDPOINTS.messages.readAll(patientId));
  },

  getUnreadCount: async (patientId: string): Promise<number> => {
    const res = await apiClient.get(
      API_ENDPOINTS.messages.unreadCount(patientId)
    );
    return res.data?.data?.count ?? res.data?.count ?? 0;
  },
};