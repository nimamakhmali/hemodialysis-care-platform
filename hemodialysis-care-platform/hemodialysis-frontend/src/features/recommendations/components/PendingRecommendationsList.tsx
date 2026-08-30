// src/features/recommendations/components/PendingRecommendationsList.tsx
"use client";

import { Sparkles } from "lucide-react";
import { usePendingRecommendations } from "../hooks/useRecommendations";
import { RecommendationCard } from "./RecommendationCard";
import { Skeleton } from "@/components/ui/Skeleton";

export function PendingRecommendationsList() {
  const { data, isLoading } = usePendingRecommendations();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
        <Sparkles className="w-12 h-12 opacity-20" />
        <p>توصیه‌ای در انتظار بررسی نیست</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((rec) => (
        <RecommendationCard key={rec.id} recommendation={rec} />
      ))}
    </div>
  );
}