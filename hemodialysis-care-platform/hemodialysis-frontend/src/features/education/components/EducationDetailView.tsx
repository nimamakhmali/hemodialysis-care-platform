// src/features/education/components/EducationDetailView.tsx
"use client";

import { motion } from "motion/react";
import { ArrowRight, Clock, Tag, BookOpen } from "lucide-react";
import Link from "next/link";
import { useEducationDetail } from "../hooks/useEducation";
import { EDUCATION_TAG_LABELS } from "../types/education.types";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";

interface Props {
  topicCode: string;
}

export function EducationDetailView({ topicCode }: Props) {
  const { data, isLoading } = useEducationDetail(topicCode);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3 rounded-xl" />
        <Skeleton className="h-4 w-1/3 rounded-xl" />
        <div className="space-y-3 mt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center text-slate-400">
        <p>محتوا یافت نشد</p>
      </div>
    );
  }

  const wordCount = data.content_fa.split(/\s+/).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Back */}
      <Link
        href="/patient/education"
        className="inline-flex items-center gap-1.5 text-sm text-sky-600 
                   hover:text-sky-700 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        بازگشت به کتابخانه آموزشی
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-sky-100 bg-gradient-to-br 
                      from-sky-50 to-cyan-50/50 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center 
                          justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-sky-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800 leading-snug">
              {data.title_fa}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                {readingMinutes} دقیقه مطالعه
              </span>
              {data.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs 
                             bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full"
                >
                  <Tag className="w-3 h-3" />
                  {EDUCATION_TAG_LABELS[tag] ?? tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8">
        <div
          className={cn(
            "prose prose-slate max-w-none",
            "prose-p:text-slate-700 prose-p:leading-relaxed prose-p:text-sm",
            "prose-headings:text-slate-800",
            "prose-li:text-slate-700 prose-li:text-sm",
            "prose-strong:text-slate-800"
          )}
        >
          {data.content_fa.split("\n").map((paragraph, i) => {
            if (!paragraph.trim()) return null;
            return (
              <p key={i} className="mb-4 text-sm text-slate-700 leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>
      </div>

      {/* Important note */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 
                      flex items-start gap-3">
        <span className="text-xl">⚠️</span>
        <p className="text-xs text-amber-700 leading-relaxed">
          اطلاعات این بخش آموزشی است و جایگزین مشاوره پزشکی نمی‌شود. 
          برای هر تصمیم درمانی با پزشک معالج خود مشورت کنید.
        </p>
      </div>
    </motion.div>
  );
}