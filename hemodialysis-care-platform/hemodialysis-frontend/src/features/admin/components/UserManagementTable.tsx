// src/features/admin/components/UserManagementTable.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Search, UserCheck, UserX,
  KeyRound, Edit3, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  useAdminUsers,
  useCreateUser,
  useUpdateUser,
  useActivateUser,
  useDeactivateUser,
  useResetPassword,
} from "../hooks/useAdmin";
import { UserForm } from "./UserForm";
import type { AdminUser, UserFilters } from "../types/admin.types";
import type { UserRole } from "@/types/common.types";
import { cn } from "@/lib/utils/cn";
import { formatPersianDate } from "@/lib/utils/date.utils";
import { Skeleton } from "@/components/ui/Skeleton";

const ROLE_LABELS: Record<UserRole, string> = {
  patient: "بیمار",
  clinician: "کلینیسین",
  admin: "مدیر",
};

const ROLE_COLORS: Record<UserRole, string> = {
  patient: "bg-sky-100 text-sky-700",
  clinician: "bg-violet-100 text-violet-700",
  admin: "bg-amber-100 text-amber-700",
};

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
}

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmLabel = "تأیید",
  danger = false,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 
                    flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full"
      >
        <p className="text-sm text-slate-700 text-center leading-relaxed mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 
                       text-sm text-slate-600 hover:bg-slate-50"
          >
            انصراف
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-white text-sm font-medium",
              danger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-sky-500 hover:bg-sky-600"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function UserManagementTable() {
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    size: 15,
  });
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "activate" | "deactivate" | "reset";
    user: AdminUser;
  } | null>(null);

  const { data, isLoading } = useAdminUsers({
    ...filters,
    search: search || undefined,
  });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();
  const resetPassword = useResetPassword();

  const users = data?.data ?? [];
  const totalPages = data?.pages ?? 1;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 
                              w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setFilters((f) => ({ ...f, page: 1 }));
            }}
            placeholder="جستجو نام یا موبایل..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-slate-200 
                       text-sm focus:outline-none focus:ring-2 
                       focus:ring-sky-500/30 focus:border-sky-400"
          />
        </div>

        {/* Role filter */}
        <select
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              role: e.target.value as UserRole | undefined,
              page: 1,
            }))
          }
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm 
                     bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        >
          <option value="">همه نقش‌ها</option>
          <option value="patient">بیمار</option>
          <option value="clinician">کلینیسین</option>
          <option value="admin">مدیر</option>
        </select>

        {/* Status filter */}
        <select
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              is_active:
                e.target.value === ""
                  ? undefined
                  : e.target.value === "true",
              page: 1,
            }))
          }
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm 
                     bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="true">فعال</option>
          <option value="false">غیرفعال</option>
        </select>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl 
                     bg-sky-500 hover:bg-sky-600 text-white text-sm 
                     font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          کاربر جدید
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            کاربری یافت نشد
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="divide-y divide-slate-50 md:hidden">
              {users.map((user) => (
                <UserMobileCard
                  key={user.id}
                  user={user}
                  onEdit={() => setEditingUser(user)}
                  onActivate={() =>
                    setConfirmAction({ type: "activate", user })
                  }
                  onDeactivate={() =>
                    setConfirmAction({ type: "deactivate", user })
                  }
                  onReset={() =>
                    setConfirmAction({ type: "reset", user })
                  }
                />
              ))}
            </div>

            {/* Desktop: table */}
            <table className="hidden md:table w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["نام کامل", "موبایل", "نقش", "وضعیت", "آخرین ورود", "اقدامات"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-right text-xs font-semibold 
                                   text-slate-500"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user, idx) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl bg-gradient-to-br 
                                     from-sky-400 to-cyan-500 flex items-center 
                                     justify-center text-white text-sm font-bold"
                        >
                          {user.full_name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {user.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-500 font-mono" dir="ltr">
                        {user.phone_number}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full font-medium",
                          ROLE_COLORS[user.role]
                        )}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            user.is_active ? "bg-emerald-500" : "bg-slate-300"
                          )}
                        />
                        <span className="text-xs text-slate-600">
                          {user.is_active ? "فعال" : "غیرفعال"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {user.last_login
                        ? formatPersianDate(user.last_login)
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <ActionButton
                          icon={Edit3}
                          label="ویرایش"
                          onClick={() => setEditingUser(user)}
                        />
                        {user.is_active ? (
                          <ActionButton
                            icon={UserX}
                            label="غیرفعال"
                            onClick={() =>
                              setConfirmAction({ type: "deactivate", user })
                            }
                            danger
                          />
                        ) : (
                          <ActionButton
                            icon={UserCheck}
                            label="فعال"
                            onClick={() =>
                              setConfirmAction({ type: "activate", user })
                            }
                          />
                        )}
                        <ActionButton
                          icon={KeyRound}
                          label="بازنشانی رمز"
                          onClick={() =>
                            setConfirmAction({ type: "reset", user })
                          }
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              صفحه {filters.page} از {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={(filters.page ?? 1) <= 1}
                onClick={() =>
                  setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))
                }
                className="p-2 rounded-lg border border-slate-200 
                           disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
              <button
                disabled={(filters.page ?? 1) >= totalPages}
                onClick={() =>
                  setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
                }
                className="p-2 rounded-lg border border-slate-200 
                           disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(showForm || editingUser) && (
          <UserForm
            user={editingUser ?? undefined}
            onSubmit={async (data) => {
              if (editingUser) {
                await updateUser.mutateAsync({
                  id: editingUser.id,
                  data: data as Parameters<typeof updateUser.mutateAsync>[0]["data"],
                });
                setEditingUser(null);
              } else {
                await createUser.mutateAsync(
                  data as Parameters<typeof createUser.mutateAsync>[0]
                );
                setShowForm(false);
              }
            }}
            onClose={() => {
              setShowForm(false);
              setEditingUser(null);
            }}
            isLoading={createUser.isPending || updateUser.isPending}
          />
        )}

        {confirmAction && (
          <ConfirmDialog
            message={
              confirmAction.type === "activate"
                ? `آیا می‌خواهید "${confirmAction.user.full_name}" را فعال کنید؟`
                : confirmAction.type === "deactivate"
                ? `آیا می‌خواهید "${confirmAction.user.full_name}" را غیرفعال کنید؟`
                : `رمز عبور "${confirmAction.user.full_name}" بازنشانی شود؟`
            }
            confirmLabel={
              confirmAction.type === "activate"
                ? "فعال‌سازی"
                : confirmAction.type === "deactivate"
                ? "غیرفعال‌سازی"
                : "بازنشانی"
            }
            danger={confirmAction.type === "deactivate"}
            onConfirm={async () => {
              if (confirmAction.type === "activate") {
                await activateUser.mutateAsync(confirmAction.user.id);
              } else if (confirmAction.type === "deactivate") {
                await deactivateUser.mutateAsync(confirmAction.user.id);
              } else {
                await resetPassword.mutateAsync({
                  id: confirmAction.user.id,
                  data: { new_password: "Aa@123456" },
                });
              }
              setConfirmAction(null);
            }}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "p-1.5 rounded-lg transition-colors",
        danger
          ? "hover:bg-red-50 hover:text-red-600 text-slate-400"
          : "hover:bg-sky-50 hover:text-sky-600 text-slate-400"
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function UserMobileCard({
  user,
  onEdit,
  onActivate,
  onDeactivate,
  onReset,
}: {
  user: AdminUser;
  onEdit: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onReset: () => void;
}) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 
                        to-cyan-500 flex items-center justify-center 
                        text-white font-bold">
          {user.full_name.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800">{user.full_name}</p>
          <p className="text-xs text-slate-400 font-mono">{user.phone_number}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              ROLE_COLORS[user.role]
            )}
          >
            {ROLE_LABELS[user.role]}
          </span>
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              user.is_active ? "bg-emerald-500" : "bg-slate-300"
            )}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 py-2 rounded-xl border border-slate-200 
                     text-xs text-slate-600 hover:bg-slate-50"
        >
          ویرایش
        </button>
        <button
          onClick={user.is_active ? onDeactivate : onActivate}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs transition-colors",
            user.is_active
              ? "border border-red-200 text-red-600 hover:bg-red-50"
              : "border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
          )}
        >
          {user.is_active ? "غیرفعال" : "فعال‌سازی"}
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-2 rounded-xl border border-slate-200 
                     text-xs text-slate-600 hover:bg-slate-50"
        >
          بازنشانی رمز
        </button>
      </div>
    </div>
  );
}