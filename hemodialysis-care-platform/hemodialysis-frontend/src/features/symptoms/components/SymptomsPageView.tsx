// src/features/symptoms/components/SymptomsPageView.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SymptomReportForm } from "./SymptomReportForm";
import { SymptomHistoryList } from "./SymptomHistoryList";
import { Thermometer, History, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Props {
  patientId: string;
}

export function SymptomsPageView({ patientId }: Props) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="ثبت علائم"
        description="علائم امروز خود را گزارش دهید"
        icon={<Thermometer className="w-5 h-5" />}
      />

      {/* Form */}
      <SymptomReportForm patientId={patientId} />

      {/* History toggle */}
      <motion.button
        onClick={() => setShowHistory((p) => !p)}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-2xl",
          "border border-slate-200 bg-white text-slate-600 text-sm",
          "hover:bg-slate-50 transition-colors"
        )}
        whileTap={{ scale: 0.99 }}
      >
        <History className="w-4 h-4" />
        تاریخچه علائم
        <motion.div
          animate={{ rotate: showHistory ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <SymptomHistoryList patientId={patientId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}