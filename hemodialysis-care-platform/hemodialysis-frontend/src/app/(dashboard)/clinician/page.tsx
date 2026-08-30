// src/app/(dashboard)/clinician/page.tsx
import { PageHeader } from "@/components/layout/PageHeader";
import { ClinicianDashboard } from "@/features/dashboard/components/clinician/ClinicianDashboard";

export default function ClinicianPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="داشبورد کلینیسین"
        description="نمای کلی وضعیت بیماران و هشدارهای فعال"
      />
      <ClinicianDashboard />
    </div>
  );
}