// src/features/recommendations/components/RecommendationReviewModal.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useApproveRecommendation, useRejectRecommendation } from "../hooks/useRecommendations";
import { cn } from "@/lib/utils/cn";
import { getSeverityColor, getSeverityLabel } from "@/lib/utils/medical.utils";
import type { PendingRecommendationSummary } from "@/features/dashboard/types/clinician-dashboard.types";
import type { Recommendation } from "../types/recommendation.types";

type ModalRec = PendingRecommendationSummary | Recommendation;

interface Props {
  recommendation: ModalRec;
  onClose: () => void;
}

export function RecommendationReviewModal({ recommendation, onClose }: Props) {
  const [patientContent, setPatientContent] = useState(
    "patient_content" in recommendation
      ? recommendation.patient_content ?? ""
      : ""
  );
  const [rejectReason, setRejectReason] = useState("");
  const [tab, setTab] = useState<"review" | "reject">("review");

  const approve = useApproveRecommendation();
  const reject = useRejectRecommendation();

  const colors = getSeverityColor(recommendation.priority);

  const handleApprove = async () => {
    await approve.mutateAsync({
      id: recommendation.id,
      data: { patient_content: patientContent || undefined },
    });
    onClose();
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    await reject.mutateAsync({
      id: recommendation.id,
      data: { reason: rejectReason },
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 
                   flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={cn(
              "px-6 py-4 border-b flex items-center justify-between",
              colors.bg,
              colors.border
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center",
                  "bg-white/70"
                )}
              >
                <Sparkles className={cn("w-4 h-4", colors.text)} />
              </div>
              <div>
                <p className={cn("font-semibold text-sm", colors.text)}>
                  بررسی توصیه سیستم
                </p>
                <p className="text-xs text-slate-500">
                  {"patient_name" in recommendation
                    ? recommendation.patient_name
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs px-2 py-1 rounded-full font-medium",
                  colors.badge
                )}
              >
                {getSeverityLabel(recommendation.priority)}
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mx-6 mt-4 px-4 py-3 bg-amber-50 border border-amber-100 
                          rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              این پیشنهاد توسط موتور تحلیل سیستم تولید شده و نیاز به بررسی 
              و تأیید پزشک دارد. تصمیم نهایی با پزشک معالج است.
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* System Draft */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                تحلیل سیستم برای پزشک
              </p>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 
                              leading-relaxed whitespace-pre-wrap">
                {recommendation.draft_for_clinician}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex rounded-xl border border-slate-100 overflow-hidden">
              <button
                onClick={() => setTab("review")}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium transition-colors",
                  tab === "review"
                    ? "bg-sky-500 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                ویرایش و تأیید
              </button>
              <button
                onClick={() => setTab("reject")}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium transition-colors",
                  tab === "reject"
                    ? "bg-red-500 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                رد توصیه
              </button>
            </div>

            <AnimatePresence mode="wait">
              {tab === "review" ? (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    پیام برای بیمار (ویرایش‌پذیر)
                  </p>
                  <textarea
                    value={patientContent}
                    onChange={(e) => setPatientContent(e.target.value)}
                    rows={4}
                    placeholder="متن پیامی که به بیمار نمایش داده خواهد شد..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm 
                               text-slate-700 resize-none focus:outline-none 
                               focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                  />
                  <button
                    onClick={handleApprove}
                    disabled={approve.isPending}
                    className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 
                               text-white font-medium text-sm transition-colors 
                               disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {approve.isPending ? "در حال ارسال..." : "تأیید و ارسال به بیمار"}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="reject"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    دلیل رد توصیه
                  </p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    placeholder="دلیل رد این توصیه را بنویسید..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm 
                               text-slate-700 resize-none focus:outline-none 
                               focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                  />
                  <button
                    onClick={handleReject}
                    disabled={reject.isPending || !rejectReason.trim()}
                    className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 
                               text-white font-medium text-sm transition-colors 
                               disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {reject.isPending ? "در حال رد..." : "رد توصیه"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}