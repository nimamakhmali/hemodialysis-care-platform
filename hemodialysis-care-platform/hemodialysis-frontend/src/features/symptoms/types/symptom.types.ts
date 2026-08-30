// src/features/symptoms/types/symptom.types.ts
import type { AlertSeverity } from "@/types/common.types";

export type SymptomType =
  | "shortness_of_breath"
  | "dizziness"
  | "access_site_pain"
  | "muscle_cramp"
  | "nausea"
  | "itching"
  | "headache"
  | "fatigue"
  | "chest_pain"
  | "swelling";

export type SymptomSeverity = "mild" | "moderate" | "severe";

export interface SymptomItem {
  type: SymptomType;
  severity: SymptomSeverity;
}

export interface SymptomReport {
  id: string;
  patient_id: string;
  reported_at: string;
  symptoms: SymptomItem[];
  notes?: string | null;
  related_session_id?: string | null;
  created_at: string;
}

export interface SymptomReportCreateRequest {
  symptoms: SymptomItem[];
  notes?: string;
  reported_at?: string;
  related_session_id?: string;
}

export interface SymptomFrequency {
  symptom_type: SymptomType;
  count: number;
  last_reported?: string;
}

export interface SymptomSummary {
  total_reports: number;
  period_days: number;
  frequency: SymptomFrequency[];
  most_common?: SymptomType | null;
}

export interface SymptomFilters {
  days?: number;
  limit?: number;
  offset?: number;
}

// ─── Display Maps ───────────────────────────────────────────────────────────
export const SYMPTOM_LABELS: Record<SymptomType, string> = {
  shortness_of_breath: "تنگی نفس",
  dizziness: "سرگیجه",
  access_site_pain: "درد محل فیستول",
  muscle_cramp: "کرامپ عضلانی",
  nausea: "تهوع",
  itching: "خارش",
  headache: "سردرد",
  fatigue: "ضعف و بی‌حالی",
  chest_pain: "درد قفسه سینه",
  swelling: "تورم",
};

export const SYMPTOM_EMOJIS: Record<SymptomType, string> = {
  shortness_of_breath: "😮‍💨",
  dizziness: "💫",
  access_site_pain: "🩹",
  muscle_cramp: "⚡",
  nausea: "🤢",
  itching: "🔴",
  headache: "🤕",
  fatigue: "😴",
  chest_pain: "💔",
  swelling: "🦵",
};

export const SEVERITY_LABELS: Record<SymptomSeverity, string> = {
  mild: "ملایم",
  moderate: "متوسط",
  severe: "شدید",
};

export const SEVERITY_COLORS: Record<SymptomSeverity, string> = {
  mild: "bg-emerald-100 text-emerald-700 border-emerald-200",
  moderate: "bg-amber-100 text-amber-700 border-amber-200",
  severe: "bg-red-100 text-red-700 border-red-200",
};

// علائم خطرناک که نیاز به هشدار فوری دارند
export const DANGER_SYMPTOMS: SymptomType[] = [
  "chest_pain",
  "shortness_of_breath",
];