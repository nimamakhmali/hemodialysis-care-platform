import type { RecommendationStatus } from '@/types/common.types'

interface RecommendationStatusBadgeProps {
  status: RecommendationStatus
}

const CONFIG: Record<
  RecommendationStatus,
  { label: string; cls: string }
> = {
  draft: { label: 'پیش‌نویس', cls: 'bg-slate-100 text-slate-600' },
  approved: { label: 'تأییدشده', cls: 'bg-emerald-100 text-emerald-700' },
  edited: { label: 'ویرایش‌شده', cls: 'bg-blue-100 text-blue-700' },
  rejected: { label: 'ردشده', cls: 'bg-red-100 text-red-600' },
}

export function RecommendationStatusBadge({
  status,
}: RecommendationStatusBadgeProps) {
  const { label, cls } = CONFIG[status]
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  )
}