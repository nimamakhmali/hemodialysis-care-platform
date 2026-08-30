// src/features/dashboard/components/clinician/UrgentPatientsTable.tsx
"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { AlertTriangle, ChevronLeft, Activity } from "lucide-react";
import type { UrgentPatient } from "../../types/clinician-dashboard.types";
import { cn } from "@/lib/utils/cn";
import { formatPercent, formatWeight } from "@/lib/utils/medical.utils";

interface Props {
  patients: UrgentPatient[];
}

export function UrgentPatientsTable({ patients }: Props) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">بیماران نیازمند توجه</h3>
            <p className="text-xs text-slate-400">
              {patients.length} بیمار با هشدار فعال
            </p>
          </div>
        </div>
      </div>

      {/* Empty */}
      {patients.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
          <Activity className="w-10 h-10 opacity-30" />
          <p className="text-sm">همه بیماران در وضعیت پایدار</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {patients.map((patient, idx) => (
            <motion.div
              key={patient.patient_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/60 
                         transition-colors cursor-pointer group"
              onClick={() =>
                router.push(`/clinician/patients/${patient.patient_id}`)
              }
            >
              {/* Severity indicator */}
              <div className="flex flex-col gap-1 items-center shrink-0">
                {patient.active_alerts_high > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white 
                                   text-xs flex items-center justify-center font-bold">
                    {patient.active_alerts_high}
                  </span>
                )}
                {patient.active_alerts_medium > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-white 
                                   text-xs flex items-center justify-center font-bold">
                    {patient.active_alerts_medium}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800 truncate">
                    {patient.full_name}
                  </p>
                  <span className="text-xs text-slate-400 shrink-0">
                    #{patient.medical_record_number}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {patient.last_idwg_percent != null && (
                    <span
                      className={cn(
                        "text-xs",
                        patient.last_idwg_percent >= 5
                          ? "text-red-600"
                          : patient.last_idwg_percent >= 3
                          ? "text-amber-600"
                          : "text-slate-400"
                      )}
                    >
                      IDWG {formatPercent(patient.last_idwg_percent)}
                    </span>
                  )}
                  {patient.last_pre_weight != null && (
                    <span className="text-xs text-slate-400">
                      {formatWeight(patient.last_pre_weight)}
                    </span>
                  )}
                  {patient.risk_level && (
                    <RiskBadge
                      level={patient.risk_level}
                      score={patient.risk_score}
                    />
                  )}
                </div>
              </div>

              <ChevronLeft
                className="w-4 h-4 text-slate-300 group-hover:text-sky-500 
                              transition-colors shrink-0"
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function RiskBadge({
  level,
  score,
}: {
  level: "low" | "medium" | "high";
  score?: number | null;
}) {
  const cls = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-emerald-100 text-emerald-700",
  }[level];
  const label = { high: "ریسک بالا", medium: "ریسک متوسط", low: "ریسک کم" }[
    level
  ];
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cls)}>
      {label} {score != null ? `(${score})` : ""}
    </span>
  );
}