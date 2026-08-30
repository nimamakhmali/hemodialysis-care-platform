// src/features/education/index.ts
export { EducationCard } from "./components/EducationCard";
export { EducationListView } from "./components/EducationListView";
export { EducationDetailView } from "./components/EducationDetailView";
export { EducationManagementList } from "./components/EducationManagementList";
export { EducationForm } from "./components/EducationForm";
export { RelevantEducationBanner } from "./components/RelevantEducationBanner";
export { useEducation, useEducationDetail, useRelevantEducation, useCreateEducation, useUpdateEducation } from "./hooks/useEducation";
export { educationService } from "./services/education.service";
export type * from "./types/education.types";