// src/features/dashboard/components/clinician/PendingRecsWidget.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, ChevronLeft, Sparkles } from "lucide-react";
import type { PendingRecommendationSummary } from "../../types/clinician-dashboard.types";
import { RecommendationReviewModal } from "@/features/recommendations/components/RecommendationReviewModal";
import { cn } from "@/lib/utils/cn";
import { getSeverityLabel, getSeverityColor } from "@/lib/utils/medical.utils";
import { formatRelativeTime } from "@/lib/utils/date.utils";

interface Props {
  recommendations: PendingRecommendationSummary[];
}

export function PendingRecsWidget({ recommendations }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const selectedRec = recommendations.find((r) => r.id === selected);

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">در انتظار بررسی</h3>
            <p className="text-xs text-slate-400">
              {recommendations.length} توصیه
            </p>
          </div>
        </div>

        {/* List */}
        {recommendations.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
            <Sparkles className="w-8 h-8 opacity-30" />
            <p className="text-sm">توصیه‌ای در انتظار نیست</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
            {recommendations.map((rec, idx) => {
              const colors = getSeverityColor(rec.priority);
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.06 }}
                  className="px-5 py-3.5 hover:bg-slate-50/60 cursor-pointer 
                             transition-colors group"
                  onClick={() => setSelected(rec.id)}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-1 w-2 h-2 rounded-full shrink-0",
                        colors.dot
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {rec.patient_name}
                        </p>
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded-md shrink-0",
                            colors.badge
                          )}
                        >
                          {getSeverityLabel(rec.priority)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                        {rec.draft_for_clinician}
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        {formatRelativeTime(rec.created_at)}
                      </p>
                    </div>
                    <ChevronLeft
                      className="w-4 h-4 text-slate-300 group-hover:text-sky-500 
                                    transition-colors shrink-0 mt-1"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {selected && selectedRec && (
          <RecommendationReviewModal
            recommendation={selectedRec as Parameters<typeof RecommendationReviewModal>[0]["recommendation"]}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}