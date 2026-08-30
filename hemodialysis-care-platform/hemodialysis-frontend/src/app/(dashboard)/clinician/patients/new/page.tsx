"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { PatientForm } from "@/features/patients/components/PatientForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { pageVariants } from "@/lib/animation/variants";

export default function NewPatientPage() {
  const router = useRouter();

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-3xl space-y-6 p-6"
    >
      <PageHeader
        title="افزودن بیمار جدید"
        description="اطلاعات پایه و بالینی بیمار را وارد کنید"
      />

      <motion.div
        className="rounded-2xl border border-primary-100/60 bg-white p-6 shadow-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <PatientForm
          onSuccess={() => router.push("/clinician/patients")}
          onCancel={() => router.back()}
        />
      </motion.div>
    </motion.div>
  );
}