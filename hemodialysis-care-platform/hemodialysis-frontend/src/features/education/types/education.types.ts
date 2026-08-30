// src/features/education/types/education.types.ts
export interface EducationContent {
  id: string;
  topic_code: string;
  title_fa: string;
  content_fa: string;
  tags: string[];
  trigger_conditions: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EducationCreateRequest {
  topic_code: string;
  title_fa: string;
  content_fa: string;
  tags?: string[];
  trigger_conditions?: Record<string, unknown>;
  is_active?: boolean;
}

export interface EducationUpdateRequest {
  title_fa?: string;
  content_fa?: string;
  tags?: string[];
  trigger_conditions?: Record<string, unknown>;
  is_active?: boolean;
}

export interface EducationFilters {
  search?: string;
  tags?: string[];
  is_active?: boolean;
}

export const EDUCATION_TAG_LABELS: Record<string, string> = {
  potassium: "پتاسیم",
  phosphorus: "فسفر",
  fluid: "مایعات",
  diet: "رژیم",
  weight: "وزن",
  blood_pressure: "فشار خون",
  medication: "دارو",
  access_site: "محل دسترسی",
  anemia: "کم‌خونی",
  lab: "آزمایش",
  lifestyle: "سبک زندگی",
  emergency: "اورژانس",
};