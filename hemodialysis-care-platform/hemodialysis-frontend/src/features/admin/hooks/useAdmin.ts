// src/features/admin/hooks/useAdmin.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../services/admin.service";
import { QUERY_KEYS } from "@/lib/query/queryClient";
import toast from "react-hot-toast";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
  UserFilters,
  AuditLogFilters,
} from "../types/admin.types";

export function useAdminUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.adminUsers, filters],
    queryFn: () => adminService.getUsers(filters),
    staleTime: 60 * 1000,
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.adminUsers, id],
    queryFn: () => adminService.getUser(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserRequest) => adminService.createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.adminUsers] });
      toast.success("کاربر ایجاد شد");
    },
    onError: () => toast.error("خطا در ایجاد کاربر"),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      adminService.updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.adminUsers] });
      toast.success("کاربر به‌روزرسانی شد");
    },
    onError: () => toast.error("خطا در به‌روزرسانی"),
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.activateUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.adminUsers] });
      toast.success("کاربر فعال شد");
    },
    onError: () => toast.error("خطا در فعال‌سازی"),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deactivateUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.adminUsers] });
      toast.success("کاربر غیرفعال شد");
    },
    onError: () => toast.error("خطا در غیرفعال‌سازی"),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResetPasswordRequest }) =>
      adminService.resetPassword(id, data),
    onSuccess: () => toast.success("رمز عبور بازنشانی شد"),
    onError: () => toast.error("خطا در بازنشانی رمز عبور"),
  });
}

export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.adminAuditLogs, filters],
    queryFn: () => adminService.getAuditLogs(filters),
    staleTime: 60 * 1000,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: [QUERY_KEYS.systemHealth],
    queryFn: adminService.getSystemHealth,
    refetchInterval: 30 * 1000,
    staleTime: 15 * 1000,
  });
}

export function useSystemStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.systemStats],
    queryFn: adminService.getSystemStats,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}