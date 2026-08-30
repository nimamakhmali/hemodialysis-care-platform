// src/features/recommendations/components/PatientRecommendations.tsx
"use client";

import { Sparkles } from "lucide-react";
import { usePatientRecommendations } from "../hooks/useRecommendations";
import { RecommendationCard } from "./RecommendationCard";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  patientId: string;
}

export function PatientRecommendations({ patientId }: Props) {
  const { data, isLoading } = usePatientRecommendations(patientId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
        <Sparkles className="w-10 h-10 opacity-20" />
        <p className="text-sm">توصیه‌ای ثبت نشده</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((rec) => (
        <RecommendationCard key={rec.id} recommendation={rec} showPatient={false} />
      ))}
    </div>
  );
}