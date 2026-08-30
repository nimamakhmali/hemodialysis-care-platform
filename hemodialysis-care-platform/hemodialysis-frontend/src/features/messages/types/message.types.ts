// src/features/messages/types/message.types.ts
export interface PatientMessage {
  id: string;
  patient_id: string;
  recommendation_id?: string | null;
  title: string;
  content: string;
  sent_at: string;
  sent_by?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MessageFilters {
  unread_only?: boolean;
  page?: number;
  size?: number;
}