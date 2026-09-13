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

export const QUERY_KEYS = {
  // Auth
  me: "me",

  // Patients
  patients: "patients",
  patient: (id: string) => ["patient", id] as const,
  patientSummary: (id: string) => ["patient", id, "summary"] as const,
  patientDashboard: (id: string) => ["patient", id, "dashboard"] as const,
  patientTrends: (id: string) => ["patient", id, "trends"] as const,
  patientTimeline: (id: string) => ["patient", id, "timeline"] as const,

  // Sessions
  sessions: (patientId: string) => ["sessions", patientId] as const,
  session: (patientId: string, sessionId: string) =>
    ["session", patientId, sessionId] as const,
  weightTrend: (patientId: string) => ["weightTrend", patientId] as const,
  bpTrend: (patientId: string) => ["bpTrend", patientId] as const,

  // Labs
  latestLabs: (patientId: string) => ["latestLabs", patientId] as const,
  labHistory: (patientId: string) => ["labHistory", patientId] as const,
  labTrend: (patientId: string, code: string) =>
    ["labTrend", patientId, code] as const,
  referenceRanges: "referenceRanges",

  // Symptoms
  symptoms: (patientId: string) => ["symptoms", patientId] as const,
  symptomSummary: (patientId: string) =>
    ["symptomSummary", patientId] as const,

  // Fluid & Diet
  fluidHistory: (patientId: string) => ["fluidHistory", patientId] as const,
  dietHistory: (patientId: string) => ["dietHistory", patientId] as const,
  dietSummary: (patientId: string) => ["dietSummary", patientId] as const,

  // Alerts
  alerts: "alerts",
  patientAlerts: (patientId: string) => ["alerts", patientId] as const,
  alertStats: "alertStats",

  // Recommendations
  pendingRecommendations: "pendingRecommendations",
  pendingRecommendationsCount: "pendingRecommendationsCount",
  patientRecommendations: (patientId: string) =>
    ["recommendations", patientId] as const,

  // Messages
  messages: (patientId: string) => ["messages", patientId] as const,
  unreadCount: (patientId: string) => ["unreadCount", patientId] as const,

  // Education
  education: "education",
  educationDetail: (topicCode: string) => ["education", topicCode] as const,
  relevantEducation: (patientId: string) =>
    ["relevantEducation", patientId] as const,

  // Clinician
  clinicianDashboard: "clinicianDashboard",
  clinicianPatientsOverview: "clinicianPatientsOverview",
  clinicianAlertsFeed: "clinicianAlertsFeed",

  // Admin
  adminUsers: "adminUsers",
  adminAuditLogs: "adminAuditLogs",
  systemHealth: "systemHealth",
  systemStats: "systemStats",
} as const;