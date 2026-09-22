import type { HealthStatus } from '@/types/common.types'

interface LabStatusBadgeProps {
  isAbnormal: boolean
  isCritical: boolean
  direction?: 'high' | 'low' | null
  statusFa?: string
}

export function LabStatusBadge({
  isAbnormal,
  isCritical,
  direction,
  statusFa,
}: LabStatusBadgeProps) {
  if (isCritical) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
        🔴 {direction === 'high' ? 'خیلی بالا' : direction === 'low' ? 'خیلی پایین' : 'بحرانی'}
      </span>
    )
  }
  if (isAbnormal) {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
        ⚠️ {direction === 'high' ? 'بالا' : direction === 'low' ? 'پایین' : 'غیرنرمال'}
      </span>
    )
  }
  return (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
      ✓ نرمال
    </span>
  )
}