// ═══════════════════════════════════════════════════════════════════════
// API TYPES
// ═══════════════════════════════════════════════════════════════════════

// ─── Base Response ───────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

export interface PaginatedApiResponse<T = unknown> {
  success: true
  data: T[]
  total: number
  page: number
  size: number
  pages: number
}

// ─── Error ──────────────────────────────────────────────────────────────
export interface ApiErrorDetail {
  code: string
  message: string
  details?: Record<string, unknown>
  field?: string
}

export interface ApiErrorResponse {
  success: false
  error: ApiErrorDetail
}

// ─── Auth ────────────────────────────────────────────────────────────────
export interface LoginRequest {
  phone_number: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user_info: {
    id: string
    phone_number: string
    full_name: string
    role: import('./common.types').UserRole
    is_active: boolean
  }
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface RefreshTokenResponse {
  access_token: string
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

// ─── Patient ─────────────────────────────────────────────────────────────
export interface PatientListItem {
  id: string
  medical_record_number: string
  full_name: string
  phone_number: string
  dry_weight: number
  vascular_access_type: import('./common.types').VascularAccessType
  dialysis_frequency: number
  is_active: boolean
  assigned_clinician_id?: string
  last_session_date?: string
  active_alerts: {
    high: number
    medium: number
    low: number
  }
  risk_score?: number
  weight_status?: import('./common.types').HealthStatus
  bp_status?: import('./common.types').HealthStatus
}

export interface PatientDetail extends PatientListItem {
  user_id?: string
  date_of_birth: string
  gender: import('./common.types').Gender
  dialysis_start_date: string
  dry_weight_updated_at: string
  comorbidities?: Record<string, boolean>
  created_at: string
  updated_at: string
}

export interface PatientSummary {
  patient: PatientDetail
  last_session?: DialysisSessionDetail
  latest_labs: Partial<Record<import('./common.types').LabTestCode, LabResultItem>>
  active_alerts_count: number
  risk_score?: import('./common.types').RiskScore
  weight_trend?: import('./common.types').TrendResult
  bp_trend?: import('./common.types').TrendResult
}

export interface PatientDashboard {
  patient_info: {
    id: string
    full_name: string
    dry_weight: number
    next_session_reminder?: string
  }
  weight_summary: {
    last_pre_weight?: number
    last_post_weight?: number
    dry_weight: number
    weight_gain?: number
    idwg_percent?: number
    status: import('./common.types').HealthStatus
    trend: import('./common.types').TrendDirection
  }
  bp_summary: {
    last_pre?: { systolic: number; diastolic: number }
    last_during?: { systolic: number; diastolic: number }
    last_post?: { systolic: number; diastolic: number }
    trend: import('./common.types').TrendDirection
    status: import('./common.types').HealthStatus
  }
  lab_summary: Partial<
    Record<
      import('./common.types').LabTestCode,
      { value: number; date: string; status: import('./common.types').HealthStatus; unit: string }
    >
  >
  recent_messages: PatientMessageItem[]
  unread_count: number
  relevant_education: EducationContentItem[]
  today_tasks: {
    symptoms_logged: boolean
    fluid_logged: boolean
    diet_logged: boolean
  }
}

// ─── Dialysis Session ────────────────────────────────────────────────────
export interface CreateDialysisSessionRequest {
  session_date: string
  session_start_time?: string
  session_end_time?: string
  duration_minutes?: number
  pre_weight: number
  post_weight?: number
  bp_pre_systolic?: number
  bp_pre_diastolic?: number
  bp_during_systolic?: number
  bp_during_diastolic?: number
  bp_post_systolic?: number
  bp_post_diastolic?: number
  intradialytic_events?: import('./common.types').SessionEvent[]
  notes?: string
}

export interface DialysisSessionDetail {
  id: string
  patient_id: string
  session_date: string
  session_start_time?: string
  session_end_time?: string
  duration_minutes?: number
  pre_weight: number
  post_weight?: number
  dry_weight_at_session: number
  weight_gain?: number
  uf_volume?: number
  bp_pre_systolic?: number
  bp_pre_diastolic?: number
  bp_during_systolic?: number
  bp_during_diastolic?: number
  bp_post_systolic?: number
  bp_post_diastolic?: number
  intradialytic_events?: import('./common.types').SessionEvent[]
  notes?: string
  recorded_by: string
  idwg_percent?: number
  created_at: string
  updated_at: string
}

export interface WeightTrend {
  sessions: Array<{
    date: string
    pre_weight: number
    post_weight?: number
    dry_weight: number
    weight_gain?: number
    idwg_percent?: number
    status: import('./common.types').HealthStatus
  }>
  average_idwg_percent: number
  trend: import('./common.types').TrendDirection
  concerning: boolean
}

export interface BPTrend {
  sessions: Array<{
    date: string
    pre: { systolic?: number; diastolic?: number }
    during: { systolic?: number; diastolic?: number }
    post: { systolic?: number; diastolic?: number }
    status: import('./common.types').HealthStatus
  }>
  trend: import('./common.types').TrendDirection
  average_pre_systolic: number
}

// ─── Lab Results ─────────────────────────────────────────────────────────
export interface LabResultItem {
  id: string
  panel_id: string
  patient_id: string
  test_code: import('./common.types').LabTestCode
  value: number
  unit: string
  ref_range_low?: number
  ref_range_high?: number
  is_abnormal: boolean
  abnormality_direction?: 'high' | 'low'
  created_at: string
}

export interface LabPanelDetail {
  id: string
  patient_id: string
  collected_at: string
  reported_at?: string
  notes?: string
  recorded_by: string
  results: LabResultItem[]
  created_at: string
}

export interface CreateLabPanelRequest {
  collected_at: string
  reported_at?: string
  notes?: string
  results: Array<{
    test_code: import('./common.types').LabTestCode
    value: number
    unit: string
  }>
}

export interface LabTrend {
  test_code: import('./common.types').LabTestCode
  unit: string
  history: Array<{
    date: string
    value: number
    is_abnormal: boolean
    status: import('./common.types').HealthStatus
  }>
  trend: import('./common.types').TrendResult
}

// ─── Symptom ──────────────────────────────────────────────────────────────
export interface SymptomReportItem {
  id: string
  patient_id: string
  reported_at: string
  symptoms: Array<{
    type: import('./common.types').SymptomType
    severity: import('./common.types').SymptomSeverity
  }>
  notes?: string
  related_session_id?: string
  created_at: string
}

export interface CreateSymptomReportRequest {
  reported_at?: string
  symptoms: Array<{
    type: import('./common.types').SymptomType
    severity: import('./common.types').SymptomSeverity
  }>
  notes?: string
  related_session_id?: string
}

export interface SymptomSummary {
  frequency: Partial<Record<import('./common.types').SymptomType, number>>
  most_common: import('./common.types').SymptomType[]
  recent_danger_symptoms: boolean
}

// ─── Fluid & Diet ─────────────────────────────────────────────────────────
export interface FluidLogItem {
  id: string
  patient_id: string
  log_date: string
  total_ml: number
  items?: Array<{ type: string; amount_ml: number; label: string }>
  notes?: string
  created_at: string
  updated_at: string
}

export interface UpsertFluidLogRequest {
  log_date: string
  total_ml: number
  items?: Array<{ type: string; amount_ml: number; label: string }>
  notes?: string
}

export interface DietLogItem {
  id: string
  patient_id: string
  log_date: string
  potassium_adherence: import('./common.types').DietAdherence
  phosphorus_adherence: import('./common.types').DietAdherence
  protein_adherence: import('./common.types').DietAdherence
  sodium_adherence: import('./common.types').DietAdherence
  notes?: string
  created_at: string
  updated_at: string
}

export interface UpsertDietLogRequest {
  log_date: string
  potassium_adherence: import('./common.types').DietAdherence
  phosphorus_adherence: import('./common.types').DietAdherence
  protein_adherence: import('./common.types').DietAdherence
  sodium_adherence: import('./common.types').DietAdherence
  notes?: string
}

// ─── Alert ────────────────────────────────────────────────────────────────
export interface AlertItem {
  id: string
  patient_id: string
  patient_name?: string
  severity: import('./common.types').AlertSeverity
  category: import('./common.types').AlertCategory
  title: string
  clinician_explanation: string
  evidence: Record<string, unknown>
  triggered_by_rule: string
  status: import('./common.types').AlertStatus
  acknowledged_by?: string
  acknowledged_at?: string
  resolved_at?: string
  created_at: string
}

// ─── Recommendation ──────────────────────────────────────────────────────
export interface RecommendationItem {
  id: string
  patient_id: string
  patient_name?: string
  alert_id?: string
  draft_for_clinician: string
  patient_content?: string
  education_topic?: string
  status: import('./common.types').RecommendationStatus
  priority: import('./common.types').AlertSeverity
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  created_at: string
  updated_at: string
}

export interface ApproveRecommendationRequest {
  patient_content?: string
}

export interface RejectRecommendationRequest {
  reason: string
}

// ─── Message ──────────────────────────────────────────────────────────────
export interface PatientMessageItem {
  id: string
  patient_id: string
  recommendation_id?: string
  title: string
  content: string
  sent_at: string
  sent_by: string
  read_at?: string
}

// ─── Education ────────────────────────────────────────────────────────────
export interface EducationContentItem {
  id: string
  topic_code: string
  title_fa: string
  content_fa: string
  tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Clinician Dashboard ──────────────────────────────────────────────────
export interface ClinicianDashboard {
  stats: {
    total_patients: number
    active_alerts_high: number
    active_alerts_medium: number
    pending_recommendations: number
    patients_with_no_recent_data: number
  }
  urgent_patients: PatientListItem[]
  pending_recommendations: RecommendationItem[]
  recent_activity: Array<{
    type: 'lab' | 'session' | 'symptom' | 'message'
    patient_id: string
    patient_name: string
    description: string
    time: string
  }>
}

export interface ClinicianPatientsOverview {
  patients: PatientListItem[]
  total: number
}

// ─── Admin ────────────────────────────────────────────────────────────────
export interface UserItem {
  id: string
  phone_number: string
  full_name: string
  role: import('./common.types').UserRole
  is_active: boolean
  last_login?: string
  created_at: string
}

export interface CreateUserRequest {
  phone_number: string
  full_name: string
  role: import('./common.types').UserRole
  password: string
}

export interface AuditLogItem {
  id: string
  user_id?: string
  user_name?: string
  action: string
  entity_type: string
  entity_id: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  timestamp: string
}

export interface SystemHealth {
  database: 'ok' | 'error'
  redis: 'ok' | 'error'
  celery: 'ok' | 'error'
  uptime_seconds: number
}

export interface SystemStats {
  total_patients: number
  total_sessions: number
  sessions_today: number
  total_labs: number
  active_alerts: number
  total_users: number
}