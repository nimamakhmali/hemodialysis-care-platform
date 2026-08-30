"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRouter } from "next/navigation";
import {
  User,
  Activity,
  AlertTriangle,
  ChevronLeft,
  Droplets,
  Heart,
  FlaskConical,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/date.utils";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import type { PatientSummary } from "../types/patient.types";

interface PatientCardProps {
  patient: PatientSummary;
  index?: number;
}

// ── Helper: Severity Color ────────────────────
function getSeverityConfig(high: number, medium: number) {
  if (high > 0) return { color: "red", label: "بحرانی", dot: "bg-red-500" };
  if (medium > 0) return { color: "amber", label: "هشدار", dot: "bg-amber-500" };
  return { color: "emerald", label: "پایدار", dot: "bg-emerald-500" };
}

function LabValueChip({
  label,
  value,
  status,
}: {
  label: string;
  value?: number | null;
  status?: string | null;
}) {
  if (!value) return null;

  const statusColor =
    status === "normal"
      ? "text-emerald-600 bg-emerald-50"
      : status?.includes("critical")
      ? "text-red-600 bg-red-50"
      : "text-amber-600 bg-amber-50";

  return (
    <div className={cn("flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium", statusColor)}>
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function PatientCard({ patient, index = 0 }: PatientCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  // ── 3D Tilt Effect ──────────────────────────
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 20 };
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [2, -2]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-2, 2]),
    springConfig
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const severityConfig = getSeverityConfig(
    patient.active_alerts_high,
    patient.active_alerts_medium
  );

  const hasAnyAlerts =
    patient.active_alerts_high + patient.active_alerts_medium + patient.active_alerts_low > 0;

  return (
    <motion.div
      ref={cardRef}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => router.push(`/clinician/patients/${patient.id}`)}
      className="group cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-white p-5",
          "transition-all duration-300",
          "hover:shadow-[0_8px_30px_rgba(14,165,233,0.12)]",
          patient.active_alerts_high > 0
            ? "border-red-200 bg-red-50/30"
            : patient.active_alerts_medium > 0
            ? "border-amber-200 bg-amber-50/20"
            : "border-primary-100/60"
        )}
      >
        {/* Top Glow for critical patients */}
        {patient.active_alerts_high > 0 && (
          <motion.div
            className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Background watermark */}
        <div
          className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 opacity-[0.03]"
          style={{ transform: "translate(-25%, 25%) scale(3)" }}
        >
          <User className="h-24 w-24 text-primary-500" />
        </div>

        {/* ── Header ────────────────────────── */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl",
                  "bg-gradient-to-br from-primary-400 to-cyan-500",
                  "text-base font-bold text-white shadow-sm"
                )}
              >
                {patient.full_name.charAt(0)}
              </div>
              {/* Status dot */}
              <motion.div
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                  severityConfig.dot
                )}
                animate={
                  patient.active_alerts_high > 0
                    ? { scale: [1, 1.3, 1] }
                    : {}
                }
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>

            {/* Name & ID */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 group-hover:text-primary-700 transition-colors">
                {patient.full_name}
              </h3>
              <p className="mt-0.5 text-xs text-slate-400 font-mono">
                #{patient.medical_record_number}
              </p>
            </div>
          </div>

          {/* Alert Badge */}
          {hasAnyAlerts && (
            <motion.div
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold",
                patient.active_alerts_high > 0
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
              )}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <AlertTriangle className="h-3 w-3" />
              {patient.active_alerts_high > 0
                ? `${patient.active_alerts_high} بحرانی`
                : `${patient.active_alerts_medium} هشدار`}
            </motion.div>
          )}
        </div>

        {/* ── Metrics Row ───────────────────── */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {/* IDWG */}
          <div className="rounded-xl bg-primary-50 p-2.5 text-center">
            <Droplets className="mx-auto mb-1 h-3.5 w-3.5 text-primary-400" />
            <div className="text-sm font-bold text-primary-700">
              {patient.last_idwg_percent != null ? (
                <>
                  <AnimatedNumber
                    value={patient.last_idwg_percent}
                    decimals={1}
                  />
                  <span className="text-xs">%</span>
                </>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </div>
            <p className="text-[10px] text-slate-500">IDWG</p>
          </div>

          {/* BP */}
          <div className="rounded-xl bg-cyan-50 p-2.5 text-center">
            <Heart className="mx-auto mb-1 h-3.5 w-3.5 text-cyan-400" />
            <div className="text-sm font-bold text-cyan-700">
              {patient.last_bp_pre_systolic ? (
                <AnimatedNumber value={patient.last_bp_pre_systolic} />
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </div>
            <p className="text-[10px] text-slate-500">فشار</p>
          </div>

          {/* Risk Score */}
          <div
            className={cn(
              "rounded-xl p-2.5 text-center",
              (patient.risk_score ?? 0) > 60
                ? "bg-red-50"
                : (patient.risk_score ?? 0) > 30
                ? "bg-amber-50"
                : "bg-emerald-50"
            )}
          >
            <Activity
              className={cn(
                "mx-auto mb-1 h-3.5 w-3.5",
                (patient.risk_score ?? 0) > 60
                  ? "text-red-400"
                  : (patient.risk_score ?? 0) > 30
                  ? "text-amber-400"
                  : "text-emerald-400"
              )}
            />
            <div
              className={cn(
                "text-sm font-bold",
                (patient.risk_score ?? 0) > 60
                  ? "text-red-700"
                  : (patient.risk_score ?? 0) > 30
                  ? "text-amber-700"
                  : "text-emerald-700"
              )}
            >
              {patient.risk_score != null ? (
                <AnimatedNumber value={patient.risk_score} />
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </div>
            <p className="text-[10px] text-slate-500">ریسک</p>
          </div>
        </div>

        {/* ── Lab Values ────────────────────── */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          <LabValueChip label="K" value={patient.last_k_value} />
          <LabValueChip label="Hb" value={patient.last_hb_value} />
        </div>

        {/* ── Footer ────────────────────────── */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            {patient.last_session_date ? (
              <span>{formatRelativeTime(patient.last_session_date)}</span>
            ) : (
              <span>بدون جلسه</span>
            )}
          </div>

          <motion.div
            className="flex items-center gap-1 text-xs font-medium text-primary-500"
            whileHover={{ x: -3 }}
            transition={{ duration: 0.2 }}
          >
            <span>مشاهده پرونده</span>
            <ChevronLeft className="h-3.5 w-3.5" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}