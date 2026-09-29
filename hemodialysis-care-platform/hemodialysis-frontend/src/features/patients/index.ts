export * from "./components/PatientCard";
export * from "./components/PatientForm";
export * from "./components/PatientList";
export * from "./components/PatientProfile";
export * from "./components/PatientSearchBar";
export * from "./components/PatientStatusBadge";
export * from "./components/PatientSummaryCard";

// Hooks — explicit re-exports to avoid name collisions between
// usePatients.ts and usePatient.ts (both define usePatients/usePatient/…)
export {
  usePatients,
  usePatient,
  useCreatePatient,
  useUpdatePatient,
  PATIENT_KEYS,
} from "./hooks/usePatients";
export { usePatientSummary } from "./hooks/usePatient";
export { usePatientClinicalSummary } from "./hooks/usePatientClinicalSummary";

export * from "./services/patients.service";
export type * from "./types/patient.types";