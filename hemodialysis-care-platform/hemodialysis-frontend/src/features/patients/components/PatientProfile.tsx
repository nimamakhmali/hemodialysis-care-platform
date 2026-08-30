"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Droplets,
  FlaskConical,
  Bell,
  Clock,
  ArrowRight,
  Edit3,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatPersianDate } from "@/lib/utils/date.utils";
import { PatientSummaryCard } from "./PatientSummaryCard";
import { PatientStatusBadge } from "./PatientStatusBadge";
import type { PatientDetail } from "../types/patient.types";

import { SessionList } from "@/features/dialysis-sessions/components/SessionList";
import { LabHistoryTable } from "@/features/lab-results/components/LabHistoryTable";
import { AlertFeed } from "@/features/alerts/components/AlertFeed";



const TABS = [
  { id: "overview", label: "خلاصه وضعیت", icon: Activity },
  { id: "sessions", label: "جلسات دیالیز", icon: Droplets },
  { id: "labs", label: "آزمایش‌ها", icon: FlaskConical },
  { id: "alerts", label: "هشدارها", icon: Bell },
  { id: "timeline", label: "تایم‌لاین", icon: Clock },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Particle Background ───────────────────────
function ParticleField() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 4 + 3,
    delay: Math.random() * 2,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary-400/20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ── Risk Gauge ────────────────────────────────
function RiskGauge({ score }: { score: number }) {
  const level = score > 60 ? "high" : score > 30 ? "medium" : "low";
  const colors = {
    high: { track: "#FEE2E2", fill: "#EF4444", text: "text-red-600", label: "ریسک بالا" },
    medium: { track: "#FEF3C7", fill: "#F59E0B", text: "text-amber-600", label: "ریسک متوسط" },
    low: { track: "#D1FAE5", fill: "#22C55E", text: "text-emerald-600", label: "ریسک پایین" },
  }[level];

  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-20 w-20">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={colors.track}
            strokeWidth="6"
          />
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={colors.fill}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-lg font-bold", colors.text)}>
            <AnimatedNumber value={score} />
          </span>
          <span className="text-[9px] text-slate-400">/100</span>
        </div>
      </div>
      <span className={cn("text-xs font-medium", colors.text)}>{colors.label}</span>
    </div>
  );
}

// ── Profile Header ────────────────────────────
function ProfileHeader({
  patient,
  onEdit,
}: {
  patient: PatientDetail;
  onEdit: () => void;
}) {
  const router = useRouter();
  const hasHighAlert = (patient.summary?.active_alerts?.high ?? 0) > 0;
  const hasMedAlert = (patient.summary?.active_alerts?.medium ?? 0) > 0;
  const worstSeverity = hasHighAlert ? "high" : hasMedAlert ? "medium" : undefined;

  const vascularLabel: Record<string, string> = {
    fistula: "فیستول",
    graft: "گرافت",
    catheter: "کاتتر",
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-primary-100/60 bg-white"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <ParticleField />

      {/* Top gradient bar */}
      <div className="relative h-1.5 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-400 via-cyan-400 to-teal-400" />
        {hasHighAlert && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-red-400 via-red-500 to-red-400"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>

      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-transparent to-cyan-50/20 pointer-events-none" />

      <div className="relative p-6">
        {/* Back */}
        <motion.button
          onClick={() => router.push("/clinician/patients")}
          className="mb-5 flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary-600 transition-colors"
          whileHover={{ x: 3 }}
        >
          <ArrowRight className="h-3.5 w-3.5" />
          بازگشت به لیست بیماران
        </motion.button>

        <div className="flex flex-wrap items-start justify-between gap-5">
          {/* Left: Avatar + Info */}
          <div className="flex items-start gap-4">
            <div className="relative">
              <motion.div
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-cyan-500 text-2xl font-bold text-white shadow-lg"
                whileHover={{ scale: 1.05 }}
              >
                {patient.full_name.charAt(0)}
              </motion.div>
              {hasHighAlert && (
                <motion.div
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 shadow-sm"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <AlertTriangle className="h-2.5 w-2.5 text-white" />
                </motion.div>
              )}
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-800">{patient.full_name}</h1>
                <PatientStatusBadge
                  severity={worstSeverity}
                  isActive={patient.is_active}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                  #{patient.medical_record_number}
                </span>
                <span className="text-slate-300">•</span>
                <span>{patient.gender === "male" ? "مرد" : "زن"}</span>
                <span className="text-slate-300">•</span>
                <span>{vascularLabel[patient.vascular_access_type]}</span>
                <span className="text-slate-300">•</span>
                <span>{patient.dialysis_frequency} جلسه/هفته</span>
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  شروع دیالیز: {formatPersianDate(patient.dialysis_start_date)}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {patient.phone_number}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Dry weight + Risk + Edit */}
          <div className="flex items-center gap-4">
            {/* Dry Weight */}
            <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-center">
              <p className="text-xs text-slate-500">وزن خشک</p>
              <p className="text-2xl font-bold text-primary-700">
                <AnimatedNumber value={patient.dry_weight} decimals={1} />
                <span className="text-sm font-normal"> kg</span>
              </p>
              <p className="text-[10px] text-slate-400">
                {formatPersianDate(patient.dry_weight_updated_at)}
              </p>
            </div>

            {/* Risk */}
            {patient.summary?.risk?.score != null && (
              <RiskGauge score={patient.summary.risk.score} />
            )}

            {/* Edit */}
            <motion.button
              onClick={onEdit}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary-100 bg-white text-slate-500 hover:border-primary-300 hover:text-primary-600 transition-all"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Edit3 className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Tab Nav ───────────────────────────────────
function TabNav({
  active,
  onChange,
  alertCount,
}: {
  active: TabId;
  onChange: (t: TabId) => void;
  alertCount?: number;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-primary-100/60 bg-white p-1.5 shadow-sm">
      {TABS.map((tab) => (
        <motion.button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative flex min-w-max items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
            active === tab.id ? "text-primary-700" : "text-slate-500 hover:text-slate-700"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {active === tab.id && (
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-50 to-cyan-50"
              layoutId="tab-bg"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <tab.icon className="relative h-4 w-4" />
          <span className="relative">{tab.label}</span>
          {tab.id === "alerts" && (alertCount ?? 0) > 0 && (
            <motion.span
              className="relative flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {alertCount}
            </motion.span>
          )}
        </motion.button>
      ))}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────
function OverviewTab({ patient }: { patient: PatientDetail }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Main summary */}
      <motion.div
        className="lg:col-span-2 rounded-2xl border border-primary-100/60 bg-white p-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Activity className="h-4 w-4 text-primary-500" />
          خلاصه وضعیت بالینی
        </h3>
        <PatientSummaryCard
          summary={patient.summary}
          dryWeight={patient.dry_weight}
        />
      </motion.div>

      {/* Risk factors */}
      {patient.summary?.risk?.contributing_factors && (
        <motion.div
          className="rounded-2xl border border-primary-100/60 bg-white p-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h3 className="mb-4 text-sm font-semibold text-slate-700">
            عوامل موثر در ریسک
          </h3>
          <div className="space-y-3">
            {patient.summary.risk.contributing_factors.slice(0, 5).map((f, i) => (
              <motion.div
                key={f.factor}
                className="space-y-1"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{f.detail}</span>
                  <span className="font-medium text-slate-700">{f.contribution}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary-400 to-cyan-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${(f.contribution / 30) * 100}%` }}
                    transition={{ delay: 0.2 + i * 0.06, duration: 0.6 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
          {patient.summary.risk.interpretation_fa && (
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              {patient.summary.risk.interpretation_fa}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ── Coming Soon Tab ───────────────────────────
function ComingSoonTab({ label }: { label: string }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary-200 bg-primary-50/40 py-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <Activity className="h-7 w-7 text-primary-400" />
      </motion.div>
      <p className="text-sm text-slate-500">بخش {label} در حال آماده‌سازی است</p>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────
export function PatientProfile({ patient }: { patient: PatientDetail }) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6">
      <ProfileHeader patient={patient} onEdit={() => {}} />

      <TabNav
        active={activeTab}
        onChange={setActiveTab}
        alertCount={patient.summary?.active_alerts?.total}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeTab === "overview" && <OverviewTab patient={patient} />}
          {activeTab === "sessions" && (
            <div className="rounded-2xl border border-primary-100/60 bg-white p-5">
              <SessionList patientId={patient.id} dryWeight={patient.dry_weight} />
            </div>
          )}
          {activeTab === "labs" && (
            <div className="rounded-2xl border border-primary-100/60 bg-white p-5">
              <LabHistoryTable patientId={patient.id} />
            </div>
          )}
          {activeTab === "alerts" && (
            <div className="rounded-2xl border border-primary-100/60 bg-white p-5">
              <AlertFeed patientId={patient.id} />
            </div>
          )}
          {activeTab === "timeline" && <ComingSoonTab label="تایم‌لاین" />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}