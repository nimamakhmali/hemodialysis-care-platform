// src/app/(dashboard)/admin/users/page.tsx
import { PageHeader } from "@/components/layout/PageHeader";
import { UserManagementTable } from "@/features/admin/components/UserManagementTable";
import { Users } from "lucide-react";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="مدیریت کاربران"
        description="ایجاد، ویرایش و مدیریت دسترسی کاربران"
        icon={<Users className="w-5 h-5" />}
      />
      <UserManagementTable />
    </div>
  );
}