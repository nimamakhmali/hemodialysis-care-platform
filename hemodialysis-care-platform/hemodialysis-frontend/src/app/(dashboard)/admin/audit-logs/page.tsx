// src/app/(dashboard)/admin/audit-logs/page.tsx
import { PageHeader } from "@/components/layout/PageHeader";
import { AuditLogTable } from "@/features/admin/components/AuditLogTable";
import { FileText } from "lucide-react";

export default function AdminAuditLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="گزارش فعالیت"
        description="تاریخچه تمام اقدامات انجام‌شده در سیستم"
        icon={<FileText className="w-5 h-5" />}
      />
      <AuditLogTable />
    </div>
  );
}