// src/features/admin/services/admin.service.ts
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AdminUser,
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
  UserFilters,
  AuditLog,
  AuditLogFilters,
  SystemHealth,
  SystemStats,
} from "../types/admin.types";

export const adminService = {
  // ─── Users ─────────────────────────────────────────────────────────
  getUsers: async (
    filters?: UserFilters
  ): Promise<{ data: AdminUser[]; total: number; page: number; pages: number }> => {
    const res = await apiClient.get(API_ENDPOINTS.admin.users.list, {
      params: filters,
    });
    return res.data;
  },

  getUser: async (id: string): Promise<AdminUser> => {
    const res = await apiClient.get(API_ENDPOINTS.admin.users.detail(id));
    return res.data?.data ?? res.data;
  },

  createUser: async (data: CreateUserRequest): Promise<AdminUser> => {
    const res = await apiClient.post(
      API_ENDPOINTS.admin.users.create,
      data
    );
    return res.data?.data ?? res.data;
  },

  updateUser: async (
    id: string,
    data: UpdateUserRequest
  ): Promise<AdminUser> => {
    const res = await apiClient.put(
      API_ENDPOINTS.admin.users.update(id),
      data
    );
    return res.data?.data ?? res.data;
  },

  activateUser: async (id: string): Promise<AdminUser> => {
    const res = await apiClient.post(
      API_ENDPOINTS.admin.users.activate(id)
    );
    return res.data?.data ?? res.data;
  },

  deactivateUser: async (id: string): Promise<AdminUser> => {
    const res = await apiClient.post(
      API_ENDPOINTS.admin.users.deactivate(id)
    );
    return res.data?.data ?? res.data;
  },

  resetPassword: async (
    id: string,
    data: ResetPasswordRequest
  ): Promise<void> => {
    await apiClient.post(
      API_ENDPOINTS.admin.users.resetPassword(id),
      data
    );
  },

  // ─── Audit Logs ────────────────────────────────────────────────────
  getAuditLogs: async (
    filters?: AuditLogFilters
  ): Promise<{ data: AuditLog[]; total: number; page: number; pages: number }> => {
    const res = await apiClient.get(
      API_ENDPOINTS.admin.auditLogs.list,
      { params: filters }
    );
    return res.data;
  },

  exportAuditLogs: async (filters?: AuditLogFilters): Promise<Blob> => {
    const res = await apiClient.get(
      API_ENDPOINTS.admin.auditLogs.export,
      { params: filters, responseType: "blob" }
    );
    return res.data;
  },

  // ─── System ────────────────────────────────────────────────────────
  getSystemHealth: async (): Promise<SystemHealth> => {
    const res = await apiClient.get(API_ENDPOINTS.admin.system.health);
    return res.data?.data ?? res.data;
  },

  getSystemStats: async (): Promise<SystemStats> => {
    const res = await apiClient.get(API_ENDPOINTS.admin.system.stats);
    return res.data?.data ?? res.data;
  },
};