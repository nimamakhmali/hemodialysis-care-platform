// src/features/education/components/EducationListView.tsx
"use client";

import { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { useEducation } from "../hooks/useEducation";
import { EducationCard } from "./EducationCard";
import { Skeleton } from "@/components/ui/Skeleton";

export function EducationListView() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useEducation({ is_active: true });

  const filtered = (data ?? []).filter(
    (c) => !search || c.title_fa.includes(search)
  );

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 
                           w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در محتوای آموزشی..."
          className="w-full pr-9 pl-4 py-3 rounded-2xl border border-slate-200 
                     text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 
                     focus:border-sky-400 bg-white"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
          <BookOpen className="w-12 h-12 opacity-20" />
          <p className="text-sm">محتوایی یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((content) => (
            <EducationCard key={content.id} content={content} />
          ))}
        </div>
      )}
    </div>
  );
}