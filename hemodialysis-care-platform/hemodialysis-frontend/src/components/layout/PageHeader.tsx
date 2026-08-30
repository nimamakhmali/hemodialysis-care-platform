// src/components/layout/PageHeader.tsx
"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  breadcrumb?: Breadcrumb[];
}

export function PageHeader({
  title,
  subtitle,
  description,
  icon,
  actions,
  action,
  badge,
  className,
  breadcrumb,
}: PageHeaderProps) {
  const allActions = actions ?? action;
  const allSubtitle = subtitle ?? description;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex items-start justify-between gap-4 mb-6", className)}
    >
      <div className="flex items-start gap-4 min-w-0">
        {icon && (
          <div
            className={cn(
              "flex-shrink-0 w-11 h-11 rounded-2xl",
              "flex items-center justify-center",
              "bg-gradient-to-br from-sky-100 to-sky-200",
              "border border-sky-200 shadow-sm",
              "text-sky-600"
            )}
          >
            {icon}
          </div>
        )}

        <div className="min-w-0">
          {/* Breadcrumb */}
          {breadcrumb && breadcrumb.length > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              {breadcrumb.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && (
                    <span className="text-slate-300 text-xs">/</span>
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-xs text-sky-600 hover:text-sky-700 
                                 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Title + Badge */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-slate-800 leading-tight">
              {title}
            </h1>
            {badge}
          </div>

          {/* Subtitle */}
          {allSubtitle && (
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              {allSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {allActions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {allActions}
        </div>
      )}
    </motion.div>
  );
}