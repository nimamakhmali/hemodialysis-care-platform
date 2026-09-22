import type {
  AlertSeverity,
  AlertCategory,
  AlertStatus,
  RecommendationStatus,
  HealthStatus,
  DietAdherence,
  UserRole,
} from './common.types'

// ── Generic Response Wrappers ──────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string | null
}

export interface PaginatedApiResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────

export interface LoginRequest {
  phone_number: string
  password: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface CurrentUser {
  id: string
  phone_number: string
  full_name: string
  role: UserRole
  is_active: boolean
  patient_profile?: {
    patient_id: string
    dry_weight: number | null
    vascular_access_type: string | null
    dialysis_frequency: number | null
  } | null
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: CurrentUser
}

// ── User / Admin ───────────────────────────────────────────────────────────

export interface UserItem {
  id: string
  phone_number: string
  full_name: string
  role: UserRole
  is_active: boolean
  last_login: string | null
  created_at: string
  patient_profile?: {
    patient_id: string
  } | null
}

export interface CreateUserRequest {
  phone_number: string
  full_name: string
  role: UserRole
  password: string
}

// ── Patient ────────────────────────────────────────────────────────────────

export interface PatientListItem {
  id: string
  user_id: string | null
  medical_record_number: string
  full_name: string
  date_of_birth: string
  gender: 'male' | 'female'
  phone_number: string
  dry_weight: number | null
  vascular_access_type: string | null
  dialysis_frequency: number | null
  dialysis_start_date: string | null
  is_active: boolean
  assigned_clinician_id: string | null
  created_at: string
  updated_at: string
}

export interface PatientDetail extends PatientListItem {
  comorbidities?: Record<string, unknown> | null
  dry_weight_updated_at: string | null
}

export interface CreatePatientRequest {
  medical_record_number: string
  full_name: string
  date_of_birth: string
  gender: 'male' | 'female'
  phone_number: string
  dry_weight?: number
  vascular_access_type?: string
  dialysis_frequency?: number
  dialysis_start_date?: string
  comorbidities?: Record<string, unknown>
  assigned_clinician_id?: string
  create_user_account?: boolean
  password?: string
}

export interface PatientSummaryResponse {
  patient: PatientListItem
  last_session: DialysisSessionItem | null
  latest_labs: Record<string, LabResultSummary>
  active_alerts_count: number
  pending_recommendations_count: number
  last_weight: number | null
  weight_trend: string | null
  unread_messages_count: number
}

// ── Patient Dashboard ──────────────────────────────────────────────────────

export interface PatientDashboard {
  patient_info: {
    full_name: string
    dry_weight: number | null
    next_session_reminder: string | null
  }
  weight_summary: {
    last_pre_weight: number | null
    last_post_weight: number | null
    dry_weight: number | null
    weight_gain: number | null
    idwg_percent: number | null
    status: HealthStatus
    trend: string
  }
  bp_summary: {
    last_pre: { systolic: number; diastolic: number } | null
    last_during: { systolic: number; diastolic: number } | null
    last_post: { systolic: number; diastolic: number } | null
    trend: string
    status: HealthStatus
  }
  lab_summary: Record<
    string,
    {
      value: number
      date: string
      status: HealthStatus
      unit: string
    }
  >
  recent_messages: Array<{
    id: string
    title: string
    content: string
    sent_at: string
    read_at: string | null
  }>
  unread_count: number
  relevant_education: Array<{
    id: string
    topic_code: string
    title_fa: string
  }>
  today_tasks?: {
    symptoms_logged: boolean
    fluid_logged: boolean
    diet_logged: boolean
  }
}

// ── Clinician Dashboard ────────────────────────────────────────────────────

export interface ClinicianDashboard {
  stats: {
    total_patients: number
    active_alerts_high: number
    active_alerts_medium: number
    pending_recommendations: number
    patients_with_no_recent_data: number
  }
  urgent_patients: Array<{
    patient_id: string
    name: string
    medical_record_number: string
    alert_count: number
    highest_severity: AlertSeverity
    last_session_date: string | null
  }>
  pending_recommendations: Array<{
    id: string
    patient_id: string
    patient_name: string
    draft_for_clinician: string
    priority: AlertSeverity
    created_at: string
  }>
  recent_activity: Array<{
    type: 'lab' | 'session' | 'symptom' | 'fluid' | 'diet' | 'message'
    patient_id: string
    patient_name: string
    description: string
    timestamp: string
  }>
}

export interface ClinicianPatientOverview {
  patient_id: string
  name: string
  medical_record_number: string
  last_session_date: string | null
  last_lab_date: string | null
  active_alerts: {
    high: number
    medium: number
    low: number
  }
  risk_score: number | null
  weight_status: HealthStatus
  bp_status: HealthStatus
  is_active: boolean
}

// ── Dialysis Session ───────────────────────────────────────────────────────

export interface DialysisSessionItem {
  id: string
  patient_id: string
  session_date: string
  session_start_time: string | null
  session_end_time: string | null
  duration_minutes: number | null
  pre_weight: number
  post_weight: number | null
  dry_weight_at_session: number
  weight_gain: number | null
  uf_volume: number | null
  bp_pre_systolic: number | null
  bp_pre_diastolic: number | null
  bp_during_systolic: number | null
  bp_during_diastolic: number | null
  bp_post_systolic: number | null
  bp_post_diastolic: number | null
  intradialytic_events: string[]
  notes: string | null
  recorded_by: string
  created_at: string
  updated_at: string
}

export interface CreateSessionRequest {
  session_date: string
  session_start_time?: string
  duration_minutes?: number
  pre_weight: number
  post_weight?: number
  bp_pre_systolic?: number
  bp_pre_diastolic?: number
  bp_during_systolic?: number
  bp_during_diastolic?: number
  bp_post_systolic?: number
  bp_post_diastolic?: number
  intradialytic_events?: string[]
  notes?: string
}

export interface WeightTrendPoint {
  date: string
  pre_weight: number
  post_weight: number | null
  dry_weight: number
  idwg_kg: number | null
  idwg_percent: number | null
}

export interface BPTrendPoint {
  date: string
  pre_systolic: number | null
  pre_diastolic: number | null
  during_systolic: number | null
  during_diastolic: number | null
  post_systolic: number | null
  post_diastolic: number | null
}

// ── Lab ────────────────────────────────────────────────────────────────────

export interface LabResultSummary {
  value: number
  date: string
  unit: string
  is_abnormal: boolean
  is_critical: boolean
}

// ── Alert ──────────────────────────────────────────────────────────────────

export interface AlertItem {
  id: string
  patient_id: string
  patient_name?: string
  severity: AlertSeverity
  category: AlertCategory
  title: string
  clinician_explanation: string
  evidence: Record<string, unknown>
  triggered_by_rule: string
  status: AlertStatus
  acknowledged_by: string | null
  acknowledged_at: string | null
  resolved_at: string | null
  created_at: string
}

// ── Recommendation ─────────────────────────────────────────────────────────

export interface RecommendationItem {
  id: string
  patient_id: string
  patient_name?: string
  alert_id: string | null
  draft_for_clinician: string
  patient_content: string | null
  education_topic: string | null
  status: RecommendationStatus
  priority: AlertSeverity
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
  updated_at: string
}

export interface ApproveRecommendationRequest {
  patient_content?: string
}

export interface RejectRecommendationRequest {
  reason: string
}

// ── Message ────────────────────────────────────────────────────────────────

export interface PatientMessageItem {
  id: string
  patient_id: string
  recommendation_id: string | null
  title: string
  content: string
  sent_at: string
  sent_by: string
  read_at: string | null
  created_at: string
}

// ── Education ──────────────────────────────────────────────────────────────

export interface EducationContentItem {
  id: string
  topic_code: string
  title_fa: string
  content_fa: string
  tags: string[]
  trigger_conditions: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

// ── Audit Log ──────────────────────────────────────────────────────────────

export interface AuditLogItem {
  id: string
  user_id: string | null
  user_name?: string | null
  action: string
  entity_type: string
  entity_id: string
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  timestamp: string
}

// ── Admin Stats ────────────────────────────────────────────────────────────

export interface SystemStats {
  total_patients: number
  active_patients: number
  total_users: number
  users_by_role: Record<string, number>
  total_sessions_today: number
  total_alerts_open: number
}

export interface SystemHealth {
  database: 'ok' | 'error'
  redis: 'ok' | 'error'
  celery: 'ok' | 'error'
  uptime: number
}