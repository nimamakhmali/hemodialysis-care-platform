// src/features/recommendations/components/RecommendationCard.tsx
"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Sparkles, Clock, ChevronDown, ChevronUp, User } from "lucide-react";
import type { Recommendation } from "../types/recommendation.types";
import { RecommendationReviewModal } from "./RecommendationReviewModal";
import { RecommendationStatusBadge } from "./RecommendationStatusBadge";
import { cn } from "@/lib/utils/cn";
import { getSeverityColor, getSeverityLabel } from "@/lib/utils/medical.utils";
import { formatRelativeTime } from "@/lib/utils/date.utils";

interface Props {
  recommendation: Recommendation;
  showPatient?: boolean;
}

export function RecommendationCard({ recommendation, showPatient = true }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const colors = getSeverityColor(recommendation.priority);

  const isPending = recommendation.status === "draft";

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border bg-white overflow-hidden transition-shadow hover:shadow-md",
          colors.border
        )}
      >
        <div className={cn("h-0.5", colors.dot.replace("bg-", "bg-"))} />
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                colors.bg
              )}
            >
              <Sparkles className={cn("w-4 h-4", colors.text)} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      colors.badge
                    )}
                  >
                    {getSeverityLabel(recommendation.priority)}
                  </span>
                  <RecommendationStatusBadge status={recommendation.status} />
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(recommendation.created_at)}
                  </span>
                </div>

                {isPending && (
                  <button
                    onClick={() => setReviewing(true)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-sky-500 
                               text-white hover:bg-sky-600 transition-colors shrink-0"
                  >
                    بررسی
                  </button>
                )}
              </div>

              {showPatient && recommendation.patient_name && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                  <User className="w-3 h-3" />
                  {recommendation.patient_name}
                </div>
              )}

              <p className="mt-2 text-sm text-slate-700 leading-relaxed line-clamp-3">
                {recommendation.draft_for_clinician}
              </p>

              {recommendation.triggered_by_rule && (
                <p className="mt-1 text-xs text-slate-400">
                  قانون:{" "}
                  <span className="font-mono">
                    {recommendation.triggered_by_rule}
                  </span>
                </p>
              )}

              {/* Expand */}
              {recommendation.evidence &&
                Object.keys(recommendation.evidence).length > 0 && (
                  <button
                    onClick={() => setExpanded((p) => !p)}
                    className="mt-2 flex items-center gap-1 text-xs text-slate-400 
                               hover:text-slate-600 transition-colors"
                  >
                    {expanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" /> پنهان کردن داده‌ها
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" /> نمایش داده‌های مرتبط
                      </>
                    )}
                  </button>
                )}

              <AnimatePresence>
                {expanded && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(recommendation.evidence ?? {}).map(
                        ([k, v]) => (
                          <div key={k} className="text-xs">
                            <span className="text-slate-400">{k}: </span>
                            <span className="text-slate-700 font-medium">
                              {String(v)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </AnimatePresence>

              {/* Review notes */}
              {recommendation.review_notes && (
                <div className="mt-3 p-3 bg-amber-50 rounded-xl">
                  <p className="text-xs text-amber-700">
                    یادداشت پزشک: {recommendation.review_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {reviewing && (
          <RecommendationReviewModal
            recommendation={recommendation}
            onClose={() => setReviewing(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}