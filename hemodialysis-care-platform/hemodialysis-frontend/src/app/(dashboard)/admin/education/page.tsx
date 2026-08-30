// src/app/(dashboard)/admin/education/page.tsx
import { PageHeader } from "@/components/layout/PageHeader";
import { EducationManagementList } from "@/features/education/components/EducationManagementList";
import { BookOpen } from "lucide-react";

export default function AdminEducationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="محتوای آموزشی"
        description="مدیریت و ویرایش محتوای آموزشی بیماران"
        icon={<BookOpen className="w-5 h-5" />}
      />
      <EducationManagementList />
    </div>
  );
}