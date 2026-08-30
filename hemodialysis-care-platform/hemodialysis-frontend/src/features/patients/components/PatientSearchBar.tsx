"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PatientSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterToggle?: () => void;
  hasActiveFilters?: boolean;
  placeholder?: string;
  className?: string;
}

export function PatientSearchBar({
  value,
  onChange,
  onFilterToggle,
  hasActiveFilters = false,
  placeholder = "جستجو بیمار، کد بیمارستانی یا شماره تلفن…",
  className,
}: PatientSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);

  return (
    <motion.div
      className={cn("relative flex items-center gap-2", className)}
      initial={false}
    >
      {/* Search Input Container */}
      <motion.div
        className="relative flex-1"
        animate={{
          scale: isFocused ? 1.005 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Glow effect when focused */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              className="absolute inset-0 rounded-xl bg-primary-500/10 blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>

        <div
          className={cn(
            "relative flex items-center rounded-xl border bg-white transition-all duration-200",
            isFocused
              ? "border-primary-400 shadow-[0_0_0_3px_rgba(14,165,233,0.12)]"
              : "border-primary-100 shadow-sm hover:border-primary-200"
          )}
        >
          {/* Search Icon */}
          <motion.div
            className="pointer-events-none absolute right-3.5"
            animate={{ color: isFocused ? "#0EA5E9" : "#94A3B8" }}
            transition={{ duration: 0.2 }}
          >
            <Search className="h-4.5 w-4.5" />
          </motion.div>

          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            dir="rtl"
            className={cn(
              "w-full rounded-xl bg-transparent py-3 pr-10 pl-10 text-sm",
              "text-slate-800 placeholder:text-slate-400",
              "outline-none ring-0"
            )}
          />

          {/* Clear Button */}
          <AnimatePresence>
            {value && (
              <motion.button
                onClick={handleClear}
                className="absolute left-3 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-3 w-3" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Filter Button */}
      {onFilterToggle && (
        <motion.button
          onClick={onFilterToggle}
          className={cn(
            "relative flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-200",
            hasActiveFilters
              ? "border-primary-400 bg-primary-50 text-primary-600"
              : "border-primary-100 bg-white text-slate-500 hover:border-primary-200 hover:text-primary-500"
          )}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <SlidersHorizontal className="h-4.5 w-4.5" />

          {/* Active indicator */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              />
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </motion.div>
  );
}