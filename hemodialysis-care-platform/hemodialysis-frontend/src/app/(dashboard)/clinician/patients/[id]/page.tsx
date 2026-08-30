"use client";

import { use } from "react";
import { motion } from "motion/react";
import { usePatient } from "@/features/patients/hooks/usePatients";
import { PatientProfile } from "@/features/patients/components/PatientProfile";
import { PageLoader } from "@/components/feedback/PageLoader";
import { pageVariants } from "@/lib/animation/variants";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PatientDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: patient, isLoading, isError } = usePatient(id);

  if (isLoading) return <PageLoader />;

  if (isError || !patient) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-500">بیمار یافت نشد یا خطایی رخ داده است.</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <PatientProfile patient={patient} />
    </motion.div>
  );
}