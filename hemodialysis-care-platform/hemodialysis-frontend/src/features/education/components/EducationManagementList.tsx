// src/features/education/components/EducationManagementList.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Search, BookOpen, Edit3,
  Eye, EyeOff, Tag,
} from "lucide-react";
import { useEducation, useCreateEducation, useUpdateEducation } from "../hooks/useEducation";
import { EducationForm } from "./EducationForm";
import type { EducationContent } from "../types/education.types";
import { EDUCATION_TAG_LABELS } from "../types/education.types";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/Skeleton";

export function EducationManagementList() {
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [showForm, setShowForm] = useState(false);
  const [editingContent, setEditingContent] =
    useState<EducationContent | null>(null);

  const { data, isLoading } = useEducation({
    is_active:
      filterActive === "all"
        ? undefined
        : filterActive === "active",
  });

  const createEdu = useCreateEducation();
  const updateEdu = useUpdateEducation();

  const filtered = (data ?? []).filter(
    (c) =>
      !search ||
      c.title_fa.includes(search) ||
      c.topic_code.includes(search.toUpperCase())
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 
                              w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در محتوا..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-slate-200 
                       text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          />
        </div>

        {(["all", "active", "inactive"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterActive(f)}
            className={cn(
              "px-3 py-2.5 rounded-xl text-sm transition-colors",
              filterActive === f
                ? "bg-sky-500 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {f === "all" ? "همه" : f === "active" ? "فعال" : "غیرفعال"}
          </button>
        ))}

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl 
                     bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          محتوای جدید
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <BookOpen className="w-12 h-12 opacity-20 mx-auto mb-3" />
          <p className="text-sm">محتوایی یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((content, idx) => (
            <motion.div
              key={content.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={cn(
                "rounded-2xl border bg-white p-5 space-y-3",
                content.is_active ? "border-slate-100" : "border-slate-100 opacity-60"
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {content.title_fa}
                    </p>
                    <p className="text-xs font-mono text-slate-400">
                      {content.topic_code}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium",
                      content.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {content.is_active ? "فعال" : "غیرفعال"}
                  </span>
                  <button
                    onClick={() => setEditingContent(content)}
                    className="p-1.5 rounded-lg hover:bg-sky-50 
                               hover:text-sky-600 text-slate-400 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      updateEdu.mutate({
                        id: content.id,
                        data: { is_active: !content.is_active },
                      })
                    }
                    className="p-1.5 rounded-lg hover:bg-slate-100 
                               text-slate-400 transition-colors"
                  >
                    {content.is_active ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Preview */}
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                {content.content_fa}
              </p>

              {/* Tags */}
              {content.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag className="w-3 h-3 text-slate-400" />
                  {content.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-sky-50 text-sky-700 
                                 px-2 py-0.5 rounded-full"
                    >
                      {EDUCATION_TAG_LABELS[tag] ?? tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {(showForm || editingContent) && (
          <EducationForm
            content={editingContent ?? undefined}
            onSubmit={async (formData) => {
              if (editingContent) {
                await updateEdu.mutateAsync({
                  id: editingContent.id,
                  data: formData,
                });
                setEditingContent(null);
              } else {
                await createEdu.mutateAsync(
                  formData as Parameters<typeof createEdu.mutateAsync>[0]
                );
                setShowForm(false);
              }
            }}
            onClose={() => {
              setShowForm(false);
              setEditingContent(null);
            }}
            isLoading={createEdu.isPending || updateEdu.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}