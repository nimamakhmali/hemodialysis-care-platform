// src/features/fluid-diet/types/fluid-diet.types.ts
export type DietAdherence = "good" | "moderate" | "poor";

export interface FluidItem {
  type: string;
  amount_ml: number;
  label?: string;
}

export interface FluidLog {
  id: string;
  patient_id: string;
  log_date: string;
  total_ml: number;
  items?: FluidItem[] | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FluidLogCreateRequest {
  log_date: string;
  total_ml: number;
  items?: FluidItem[];
  notes?: string;
}

export interface FluidHistory {
  date: string;
  total_ml: number;
}

export interface DietLog {
  id: string;
  patient_id: string;
  log_date: string;
  potassium_adherence: DietAdherence;
  phosphorus_adherence: DietAdherence;
  protein_adherence: DietAdherence;
  sodium_adherence: DietAdherence;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DietLogCreateRequest {
  log_date: string;
  potassium_adherence: DietAdherence;
  phosphorus_adherence: DietAdherence;
  protein_adherence: DietAdherence;
  sodium_adherence: DietAdherence;
  notes?: string;
}

export interface DietSummary {
  period_days: number;
  potassium_avg: DietAdherence | null;
  phosphorus_avg: DietAdherence | null;
  protein_avg: DietAdherence | null;
  sodium_avg: DietAdherence | null;
  adherence_score: number;
  days_logged: number;
}

// ─── Display Maps ───────────────────────────────────────────────────────────
export const DIET_ADHERENCE_LABELS: Record<DietAdherence, string> = {
  good: "خوب",
  moderate: "تقریباً",
  poor: "رعایت نکردم",
};

export const DIET_ADHERENCE_COLORS: Record<DietAdherence, string> = {
  good: "bg-emerald-50 border-emerald-200 text-emerald-700",
  moderate: "bg-amber-50 border-amber-200 text-amber-700",
  poor: "bg-red-50 border-red-200 text-red-700",
};

export const DIET_ADHERENCE_DOT: Record<DietAdherence, string> = {
  good: "bg-emerald-500",
  moderate: "bg-amber-500",
  poor: "bg-red-500",
};

export const QUICK_FLUID_ITEMS: Array<{
  label: string;
  type: string;
  amount_ml: number;
  emoji: string;
}> = [
  { label: "لیوان آب", type: "water", amount_ml: 200, emoji: "💧" },
  { label: "فنجان چای", type: "tea", amount_ml: 150, emoji: "🍵" },
  { label: "فنجان قهوه", type: "coffee", amount_ml: 120, emoji: "☕" },
  { label: "کاسه سوپ", type: "soup", amount_ml: 300, emoji: "🍲" },
  { label: "لیوان شیر", type: "milk", amount_ml: 200, emoji: "🥛" },
  { label: "آبمیوه", type: "juice", amount_ml: 150, emoji: "🧃" },
];