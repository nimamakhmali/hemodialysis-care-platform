import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })
          ?.response?.status
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

// ── Query Keys ──────────────────────────────────────────────────────────────
export const QUERY_KEYS = {
  // Auth
  me: ['me'] as const,

  // Patients
  patients: (filters?: Record<string, unknown>) =>
    filters ? ['patients', filters] : ['patients'],
  patient: (id: string) => ['patient', id] as const,
  patientSummary: (id: string) => ['patient', id, 'summary'] as const,
  patientTimeline: (id: string) => ['patient', id, 'timeline'] as const,

  // Dashboard
  patientDashboard: (id: string) => ['patient', id, 'dashboard'] as const,
  patientTrends: (id: string) => ['patient', id, 'trends'] as const,
  clinicianDashboard: 'clinician-dashboard' as const,
  clinicianOverview: 'clinician-overview' as const,

  // Sessions
  sessions: (patientId: string) =>
    ['patient', patientId, 'sessions'] as const,
  session: (patientId: string, sessionId: string) =>
    ['patient', patientId, 'sessions', sessionId] as const,
  weightTrend: (patientId: string) =>
    ['patient', patientId, 'weight-trend'] as const,
  bpTrend: (patientId: string) =>
    ['patient', patientId, 'bp-trend'] as const,

  // Labs
  labHistory: (patientId: string) =>
    ['patient', patientId, 'labs'] as const,
  latestLabs: (patientId: string) =>
    ['patient', patientId, 'labs', 'latest'] as const,
  labTrend: (patientId: string, testCode: string) =>
    ['patient', patientId, 'labs', 'trend', testCode] as const,
  referenceRanges: 'reference-ranges' as const,

  // Symptoms
  symptoms: (patientId: string) =>
    ['patient', patientId, 'symptoms'] as const,
  symptomSummary: (patientId: string) =>
    ['patient', patientId, 'symptoms', 'summary'] as const,

  // Fluid
  fluidHistory: (patientId: string) =>
    ['patient', patientId, 'fluid'] as const,

  // Diet
  dietHistory: (patientId: string) =>
    ['patient', patientId, 'diet'] as const,
  dietSummary: (patientId: string) =>
    ['patient', patientId, 'diet', 'summary'] as const,

  // Alerts
  alerts: (patientId?: string) =>
    patientId
      ? (['patient', patientId, 'alerts'] as const)
      : (['alerts'] as const),
  allAlerts: ['alerts', 'all'] as const,

  // Recommendations
  recommendations: (patientId?: string) =>
    patientId
      ? (['patient', patientId, 'recommendations'] as const)
      : (['recommendations'] as const),
  pendingRecommendations: ['recommendations', 'pending'] as const,

  // Messages
  messages: (patientId: string) =>
    ['patient', patientId, 'messages'] as const,
  unreadCount: (patientId: string) =>
    ['patient', patientId, 'messages', 'unread-count'] as const,

  // Education
  education: 'education' as const,
  educationDetail: (topicCode: string) =>
    ['education', topicCode] as const,
  relevantEducation: (patientId: string) =>
    ['patient', patientId, 'education', 'relevant'] as const,

  // Admin
  adminUsers: 'admin-users' as const,
  adminUser: (id: string) => ['admin-users', id] as const,
  auditLogs: 'audit-logs' as const,
  systemStats: 'system-stats' as const,
  systemHealth: 'system-health' as const,
} as const