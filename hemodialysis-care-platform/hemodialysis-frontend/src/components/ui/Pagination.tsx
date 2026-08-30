"use client";

import { motion } from "motion/react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const visiblePages = pages.filter(
    (p) =>
      p === 1 ||
      p === totalPages ||
      Math.abs(p - currentPage) <= 1
  );

  return (
    <motion.div
      className="flex items-center justify-center gap-1.5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl border transition-all",
          currentPage === 1
            ? "cursor-not-allowed border-slate-100 text-slate-300"
            : "border-primary-100 text-slate-600 hover:border-primary-300 hover:text-primary-600"
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Pages */}
      {visiblePages.map((p, idx) => {
        const prev = visiblePages[idx - 1];
        const showEllipsis = prev && p - prev > 1;

        return (
          <div key={p} className="flex items-center gap-1.5">
            {showEllipsis && (
              <span className="text-sm text-slate-400">…</span>
            )}
            <motion.button
              onClick={() => onPageChange(p)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-all",
                currentPage === p
                  ? "bg-primary-500 text-white shadow-sm"
                  : "border border-primary-100 text-slate-600 hover:border-primary-300 hover:text-primary-600"
              )}
              whileHover={{ scale: currentPage !== p ? 1.05 : 1 }}
              whileTap={{ scale: 0.95 }}
            >
              {p}
            </motion.button>
          </div>
        );
      })}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl border transition-all",
          currentPage === totalPages
            ? "cursor-not-allowed border-slate-100 text-slate-300"
            : "border-primary-100 text-slate-600 hover:border-primary-300 hover:text-primary-600"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </motion.div>
  );
}