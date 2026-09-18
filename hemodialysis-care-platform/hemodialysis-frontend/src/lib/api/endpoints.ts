// ═══════════════════════════════════════════════════════════════════════
// API ENDPOINTS — مرکزی
// منبع: OpenAPI واقعی بک‌اند (تمام مسیرها بدون trailing slash اضافی،
// دقیقاً مطابق Swagger — هیچ مسیری حدس زده نشده است)
// ═══════════════════════════════════════════════════════════════════════

export const API_ENDPOINTS = {
  // ─── Auth ──────────────────────────────────────────────────────────
  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    changePassword: '/auth/change-password',
    me: '/auth/me',
  },

  // ─── Patients ──────────────────────────────────────────────────────
  patients: {
    list: '/patients/',
    create: '/patients/',
    search: '/patients/search',
    detail: (id: string) => `/patients/${id}`,
    update: (id: string) => `/patients/${id}`,
    deactivate: (id: string) => `/patients/${id}`,
    summary: (id: string) => `/patients/${id}/summary`,
    dashboard: (id: string) => `/patients/${id}/dashboard`,
    trends: (id: string) => `/patients/${id}/trends`,
    healthStatus: (id: string) => `/patients/${id}/health-status`,
  },

  // ─── Sessions ──────────────────────────────────────────────────────
  sessions: {
    list: (patientId: string) => `/patients/${patientId}/sessions`,
    create: (patientId: string) => `/patients/${patientId}/sessions`,
    detail: (patientId: string, sessionId: string) =>
      `/patients/${patientId}/sessions/${sessionId}`,
    update: (patientId: string, sessionId: string) =>
      `/patients/${patientId}/sessions/${sessionId}`,
    weightTrend: (patientId: string) =>
      `/patients/${patientId}/sessions/weight-trend`,
    bpTrend: (patientId: string) => `/patients/${patientId}/sessions/bp-trend`,
  },

  // ─── Labs ──────────────────────────────────────────────────────────
  labs: {
    // GET همین مسیر = تاریخچه/لیست، POST همین مسیر = ثبت پنل جدید
    list: (patientId: string) => `/patients/${patientId}/labs`,
    history: (patientId: string) => `/patients/${patientId}/labs`,
    create: (patientId: string) => `/patients/${patientId}/labs`,
    latest: (patientId: string) => `/patients/${patientId}/labs/latest`,
    panelDetail: (patientId: string, panelId: string) =>
      `/patients/${patientId}/labs/${panelId}`,
    trend: (patientId: string, testCode: string) =>
      `/patients/${patientId}/labs/trend/${testCode}`,
    referenceRanges: '/labs/reference-ranges',
  },

  // ─── Symptoms ──────────────────────────────────────────────────────
  symptoms: {
    create: (patientId: string) => `/patients/${patientId}/symptoms`,
    list: (patientId: string) => `/patients/${patientId}/symptoms`,
    summary: (patientId: string) => `/patients/${patientId}/symptoms/summary`,
  },

  // ─── Fluid ─────────────────────────────────────────────────────────
  fluid: {
    log: (patientId: string) => `/patients/${patientId}/fluid`,
    history: (patientId: string) => `/patients/${patientId}/fluid`,
  },

  // ─── Diet ──────────────────────────────────────────────────────────
  diet: {
    log: (patientId: string) => `/patients/${patientId}/diet`,
    history: (patientId: string) => `/patients/${patientId}/diet`,
    summary: (patientId: string) => `/patients/${patientId}/diet/summary`,
  },

  // ─── Alerts ────────────────────────────────────────────────────────
  alerts: {
    all: '/alerts',
    stats: '/alerts/stats',
    patient: (patientId: string) => `/patients/${patientId}/alerts`,
    acknowledge: (alertId: string) => `/alerts/${alertId}/acknowledge`,
    resolve: (alertId: string) => `/alerts/${alertId}/resolve`,
  },

  // ─── Recommendations ───────────────────────────────────────────────
  recommendations: {
    pending: '/recommendations/pending',
    pendingCount: '/recommendations/pending-count',
    patient: (patientId: string) => `/patients/${patientId}/recommendations`,
    approve: (recId: string) => `/recommendations/${recId}/approve`,
    reject: (recId: string) => `/recommendations/${recId}/reject`,
  },

  // ─── Messages ──────────────────────────────────────────────────────
  messages: {
    list: (patientId: string) => `/patients/${patientId}/messages`,
    read: (messageId: string) => `/messages/${messageId}/read`,
    readAll: (patientId: string) => `/patients/${patientId}/messages/read-all`,
    unreadCount: (patientId: string) =>
      `/patients/${patientId}/messages/unread-count`,
  },

  // ─── Education ─────────────────────────────────────────────────────
  education: {
    list: '/education',
    create: '/education',
    search: '/education/search',
    detail: (topicCode: string) => `/education/${topicCode}`,
    update: (contentId: string) => `/education/${contentId}`,
    relevant: (patientId: string) => `/patients/${patientId}/education/relevant`,
  },

  // ─── Clinician ─────────────────────────────────────────────────────
  clinician: {
    dashboard: '/clinician/dashboard',
    overview: '/clinician/patients-overview',
    alertsFeed: '/clinician/alerts-feed',
    clinicalSummary: (patientId: string) =>
      `/clinician/patient/${patientId}/clinical-summary`,
  },

  // ─── Admin ─────────────────────────────────────────────────────────
  // ✅ اکنون پیاده‌سازی شده در بک‌اند (admin_users.py, admin_audit.py, admin_system.py)
  admin: {
    users: {
      list: '/admin/users/',
      create: '/admin/users/',
      detail: (id: string) => `/admin/users/${id}/`,
      update: (id: string) => `/admin/users/${id}/`,
      activate: (id: string) => `/admin/users/${id}/activate/`,
      deactivate: (id: string) => `/admin/users/${id}/deactivate/`,
      resetPassword: (id: string) => `/admin/users/${id}/reset-password/`,
    },
    auditLogs: {
      list: '/admin/audit-logs/',
      export: '/admin/audit-logs/export/',
    },
    system: {
      health: '/admin/system/health/',
      stats: '/admin/system/stats/',
    },
  },
} as const

