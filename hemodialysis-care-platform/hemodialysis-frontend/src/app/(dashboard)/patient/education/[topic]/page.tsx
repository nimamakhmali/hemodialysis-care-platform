// src/app/(dashboard)/patient/education/[topic]/page.tsx
"use client";

import { use } from "react";
import { EducationDetailView } from "@/features/education/components/EducationDetailView";

interface PageProps {
  params: Promise<{ topic: string }>;
}

export default function EducationDetailPage({ params }: PageProps) {
  const { topic } = use(params);
  return <EducationDetailView topicCode={topic} />;
}