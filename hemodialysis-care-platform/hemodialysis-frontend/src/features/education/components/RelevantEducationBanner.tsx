// src/features/education/components/RelevantEducationBanner.tsx
"use client";

import { Sparkles } from "lucide-react";
import { useRelevantEducation } from "../hooks/useEducation";
import { EducationCard } from "./EducationCard";

interface Props {
  patientId: string;
}

export function RelevantEducationBanner({ patientId }: Props) {
  const { data } = useRelevantEducation(patientId);
  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-sky-500" />
        <p className="text-sm font-semibold text-slate-700">
          مرتبط با وضعیت شما
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.slice(0, 2).map((content) => (
          <EducationCard key={content.id} content={content} relevant />
        ))}
      </div>
    </div>
  );
}