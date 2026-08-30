// src/features/admin/index.ts
export { AdminDashboardView } from "./components/AdminDashboardView";
export { UserManagementTable } from "./components/UserManagementTable";
export { UserForm } from "./components/UserForm";
export { AuditLogTable } from "./components/AuditLogTable";
export { useAdminUsers, useCreateUser, useUpdateUser, useActivateUser, useDeactivateUser, useResetPassword, useAuditLogs, useSystemHealth, useSystemStats } from "./hooks/useAdmin";
export { adminService } from "./services/admin.service";
export type * from "./types/admin.types";