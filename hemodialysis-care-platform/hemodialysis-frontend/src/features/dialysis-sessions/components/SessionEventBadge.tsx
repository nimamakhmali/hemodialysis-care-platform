"use client";

import { cn } from "@/lib/utils/cn";
import type { SessionEvent } from "@/types/common.types";

const EVENT_CONFIG: Record<SessionEvent, { label: string; color: string }> = {
  hypotension: { label: "افت فشار", color: "bg-red-50 text-red-700 ring-red-200" },
  muscle_cramp: { label: "کرامپ عضلانی", color: "bg-amber-50 text-amber-700 ring-amber-200" },
  nausea_vomiting: { label: "تهوع/استفراغ", color: "bg-orange-50 text-orange-700 ring-orange-200" },
  headache: { label: "سردرد", color: "bg-purple-50 text-purple-700 ring-purple-200" },
  chest_pain: { label: "درد قفسه سینه", color: "bg-red-50 text-red-800 ring-red-300" },
  access_problem: { label: "مشکل دسترسی", color: "bg-rose-50 text-rose-700 ring-rose-200" },
  other: { label: "سایر", color: "bg-slate-50 text-slate-600 ring-slate-200" },
};

export function SessionEventBadge({ event }: { event: SessionEvent }) {
  const cfg = EVENT_CONFIG[event] ?? EVENT_CONFIG.other;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-medium ring-1",
        cfg.color
      )}
    >
      {cfg.label}
    </span>
  );
}