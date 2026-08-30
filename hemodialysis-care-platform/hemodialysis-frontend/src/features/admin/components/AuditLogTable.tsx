// src/features/admin/components/AuditLogTable.tsx
"use client";

import { useState } from "react";
import { Download, Filter } from "lucide-react";
import { useAuditLogs } from "../hooks/useAdmin";
import { adminService } from "../services/admin.service";
import type { AuditLogFilters } from "../types/admin.types";
import { cn } from "@/lib/utils/cn";
import { formatPersianDateTime } from "@/lib/utils/date.utils";
import { Skeleton } from "@/components/ui/Skeleton";

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  CREATE: { label: "ایجاد", color: "bg-emerald-100 text-emerald-700" },
  UPDATE: { label: "به‌روزرسانی", color: "bg-sky-100 text-sky-700" },
  DELETE: { label: "حذف", color: "bg-red-100 text-red-700" },
  LOGIN: { label: "ورود", color: "bg-violet-100 text-violet-700" },
  APPROVE: { label: "تأیید", color: "bg-emerald-100 text-emerald-700" },
  REJECT: { label: "رد", color: "bg-red-100 text-red-700" },
  ACKNOWLEDGE: { label: "تأیید دیدن", color: "bg-amber-100 text-amber-700" },
  RESOLVE: { label: "بستن", color: "bg-slate-100 text-slate-700" },
};

export function AuditLogTable() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    size: 20,
  });
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useAuditLogs(filters);
  const logs = data?.data ?? [];
  const totalPages = data?.pages ?? 1;

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await adminService.exportAuditLogs(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Filter className="w-4 h-4" />
          <span>فیلتر:</span>
        </div>

        <select
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              action: e.target.value || undefined,
              page: 1,
            }))
          }
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm 
                     bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        >
          <option value="">همه اقدامات</option>
          {Object.entries(ACTION_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              date_from: e.target.value || undefined,
              page: 1,
            }))
          }
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm 
                     focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        />

        <input
          type="date"
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              date_to: e.target.value || undefined,
              page: 1,
            }))
          }
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm 
                     focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        />

        <button
          onClick={handleExport}
          disabled={exporting}
          className="mr-auto flex items-center gap-2 px-4 py-2 rounded-xl 
                     border border-slate-200 text-sm text-slate-600 
                     hover:bg-slate-50 transition-colors disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          {exporting ? "در حال دانلود..." : "خروجی CSV"}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            لاگی یافت نشد
          </div>
        ) : (
          <>
            {/* Desktop */}
            <table className="hidden md:table w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["زمان", "کاربر", "اقدام", "موجودیت", "شناسه"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-right text-xs 
                                   font-semibold text-slate-500"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => {
                  const actionCfg =
                    ACTION_CONFIG[log.action] ?? {
                      label: log.action,
                      color: "bg-slate-100 text-slate-700",
                    };
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-3 text-xs text-slate-500 tabular-nums">
                        {formatPersianDateTime(log.timestamp)}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-700">
                        {log.user_full_name ?? "سیستم"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-medium",
                            actionCfg.color
                          )}
                        >
                          {actionCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {log.entity_type}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-mono text-slate-400">
                          {log.entity_id.slice(0, 8)}...
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile */}
            <div className="divide-y divide-slate-50 md:hidden">
              {logs.map((log) => {
                const actionCfg =
                  ACTION_CONFIG[log.action] ?? {
                    label: log.action,
                    color: "bg-slate-100 text-slate-700",
                  };
                return (
                  <div key={log.id} className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          actionCfg.color
                        )}
                      >
                        {actionCfg.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatPersianDateTime(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">
                      {log.user_full_name ?? "سیستم"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {log.entity_type} — {log.entity_id.slice(0, 8)}...
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-50 
                          flex items-center justify-between">
            <span className="text-xs text-slate-400">
              صفحه {filters.page} از {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={(filters.page ?? 1) <= 1}
                onClick={() =>
                  setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))
                }
                className="px-3 py-1.5 rounded-lg border border-slate-200 
                           text-xs disabled:opacity-40 hover:bg-slate-50"
              >
                قبلی
              </button>
              <button
                disabled={(filters.page ?? 1) >= totalPages}
                onClick={() =>
                  setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
                }
                className="px-3 py-1.5 rounded-lg border border-slate-200 
                           text-xs disabled:opacity-40 hover:bg-slate-50"
              >
                بعدی
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}