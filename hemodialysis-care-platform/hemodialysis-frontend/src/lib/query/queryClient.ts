import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
})

// ─── Query Keys ───────────────────────────────────────────────────────────
export const QUERY_KEYS = {
  // Auth
  me: ['auth', 'me'] as const,

  // Patients
  patients: ['patients'] as const,
  patientsList: (params: Record<string, unknown>) =>
    ['patients', 'list', params] as const,
  patient: (id: string) => ['patients', id] as const,
  patientSummary: (id: string) => ['patients', id, 'summary'] as const,
  patientDashboard: (id: string) => ['patients', id, 'dashboard'] as const,
  patientTrends: (id: string) => ['patients', id, 'trends'] as const,
  patientTimeline: (id: string) => ['patients', id, 'timeline'] as const,

  // Sessions
  sessions: (patientId: string) => ['patients', patientId, 'sessions'] as const,
  sessionsList: (patientId: string, params: Record<string, unknown>) =>
    ['patients', patientId, 'sessions', 'list', params] as const,
  session: (patientId: string, sessionId: string) =>
    ['patients', patientId, 'sessions', sessionId] as const,
  weightTrend: (patientId: string) =>
    ['patients', patientId, 'sessions', 'weight-trend'] as const,
  bpTrend: (patientId: string) =>
    ['patients', patientId, 'sessions', 'bp-trend'] as const,

  // Labs
  latestLabs: (patientId: string) =>
    ['patients', patientId, 'labs', 'latest'] as const,
  labHistory: (patientId: string, params?: Record<string, unknown>) =>
    ['patients', patientId, 'labs', 'history', params] as const,
  labPanel: (patientId: string, panelId: string) =>
    ['patients', patientId, 'labs', panelId] as const,
  labTrend: (patientId: string, testCode: string) =>
    ['patients', patientId, 'labs', 'trend', testCode] as const,
  referenceRanges: ['labs', 'reference-ranges'] as const,

  // Symptoms
  symptoms: (patientId: string, params?: Record<string, unknown>) =>
    ['patients', patientId, 'symptoms', params] as const,
  symptomSummary: (patientId: string) =>
    ['patients', patientId, 'symptoms', 'summary'] as const,

  // Fluid
  fluidHistory: (patientId: string, params?: Record<string, unknown>) =>
    ['patients', patientId, 'fluid', params] as const,

  // Diet
  dietHistory: (patientId: string, params?: Record<string, unknown>) =>
    ['patients', patientId, 'diet', params] as const,

  // Alerts
  alerts: (params?: Record<string, unknown>) =>
    ['alerts', params] as const,
  patientAlerts: (patientId: string, params?: Record<string, unknown>) =>
    ['patients', patientId, 'alerts', params] as const,

  // Recommendations
  pendingRecommendations: ['recommendations', 'pending'] as const,
  patientRecommendations: (patientId: string) =>
    ['patients', patientId, 'recommendations'] as const,

  // Messages
  messages: (patientId: string, params?: Record<string, unknown>) =>
    ['patients', patientId, 'messages', params] as const,
  unreadCount: (patientId: string) =>
    ['patients', patientId, 'messages', 'unread'] as const,

  // Education
  education: (params?: Record<string, unknown>) =>
    ['education', params] as const,
  educationDetail: (topicCode: string) =>
    ['education', topicCode] as const,
  relevantEducation: (patientId: string) =>
    ['patients', patientId, 'education', 'relevant'] as const,

  // Clinician
  clinicianDashboard: ['clinician', 'dashboard'] as const,
  clinicianOverview: (params?: Record<string, unknown>) =>
    ['clinician', 'overview', params] as const,
  alertsFeed: (params?: Record<string, unknown>) =>
    ['clinician', 'alerts-feed', params] as const,

  // Admin
  adminUsers: (params?: Record<string, unknown>) =>
    ['admin', 'users', params] as const,
  adminUser: (id: string) => ['admin', 'users', id] as const,
  auditLogs: (params?: Record<string, unknown>) =>
    ['admin', 'audit-logs', params] as const,
  systemHealth: ['admin', 'system', 'health'] as const,
  systemStats: ['admin', 'system', 'stats'] as const,
} as const