// src/features/admin/types/admin.types.ts
import type { UserRole } from "@/types/common.types";

export interface AdminUser {
  id: string;
  phone_number: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  last_login?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  phone_number: string;
  full_name: string;
  role: UserRole;
  password: string;
}

export interface UpdateUserRequest {
  full_name?: string;
  role?: UserRole;
  phone_number?: string;
}

export interface ResetPasswordRequest {
  new_password: string;
}

export interface UserFilters {
  role?: UserRole;
  is_active?: boolean;
  search?: string;
  page?: number;
  size?: number;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  user_full_name?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  timestamp: string;
}

export interface AuditLogFilters {
  user_id?: string;
  entity_type?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  size?: number;
}

export interface SystemHealth {
  status: "healthy" | "degraded" | "unavailable";
  database: "ok" | "error";
  redis: "ok" | "error";
  celery: "ok" | "error" | "unknown";
  timestamp: string;
}

export interface SystemStats {
  total_users: number;
  total_patients: number;
  total_clinicians: number;
  total_sessions: number;
  total_lab_panels: number;
  total_alerts: number;
  active_alerts: number;
  total_recommendations: number;
  pending_recommendations: number;
  sessions_today: number;
  alerts_today: number;
}