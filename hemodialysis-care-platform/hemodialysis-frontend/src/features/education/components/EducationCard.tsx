// src/features/education/components/EducationCard.tsx
"use client";

import { motion } from "motion/react";
import { BookOpen, Clock, Tag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { EducationContent } from "../types/education.types";
import { EDUCATION_TAG_LABELS } from "../types/education.types";
import { cn } from "@/lib/utils/cn";

interface Props {
  content: EducationContent;
  relevant?: boolean;
}

export function EducationCard({ content, relevant }: Props) {
  const wordCount = content.content_fa.split(/\s+/).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-2xl border bg-white overflow-hidden",
        "hover:shadow-md transition-shadow",
        relevant ? "border-sky-200" : "border-slate-100"
      )}
    >
      {relevant && (
        <div className="h-0.5 bg-gradient-to-r from-sky-400 to-cyan-400" />
      )}

      <div className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              relevant ? "bg-sky-100" : "bg-slate-100"
            )}
          >
            <BookOpen
              className={cn(
                "w-5 h-5",
                relevant ? "text-sky-600" : "text-slate-500"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 leading-snug">
              {content.title_fa}
            </h3>
            {relevant && (
              <span className="text-[10px] text-sky-600 font-medium">
                مرتبط با وضعیت شما
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
          {content.content_fa}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3" />
              {readingMinutes} دقیقه
            </span>
            {content.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-0.5 text-[10px] 
                           bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded-full"
              >
                <Tag className="w-2.5 h-2.5" />
                {EDUCATION_TAG_LABELS[tag] ?? tag}
              </span>
            ))}
          </div>
          <Link
            href={`/patient/education/${content.topic_code}`}
            className="flex items-center gap-1 text-xs text-sky-600 
                       hover:text-sky-700 font-medium transition-colors"
          >
            مطالعه
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}