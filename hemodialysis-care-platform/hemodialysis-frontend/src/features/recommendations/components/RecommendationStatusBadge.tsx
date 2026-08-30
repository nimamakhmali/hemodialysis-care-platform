// src/features/recommendations/components/RecommendationStatusBadge.tsx
import { cn } from "@/lib/utils/cn";
import type { RecommendationStatus } from "../types/recommendation.types";

const STATUS_CONFIG: Record<
  RecommendationStatus,
  { label: string; cls: string }
> = {
  draft: { label: "در انتظار بررسی", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "تأیید شده", cls: "bg-emerald-100 text-emerald-700" },
  edited: { label: "ویرایش شده", cls: "bg-sky-100 text-sky-700" },
  rejected: { label: "رد شده", cls: "bg-red-100 text-red-700" },
};

export function RecommendationStatusBadge({
  status,
}: {
  status: RecommendationStatus;
}) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "text-xs px-2 py-0.5 rounded-full font-medium",
        config.cls
      )}
    >
      {config.label}
    </span>
  );
}