'use client'

import { cn } from '@lib/utils/cn'
import type { HealthStatus } from '@appTypes/common.types'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  sublabel?: string
  showValue?: boolean
  status?: HealthStatus
  size?: 'xs' | 'sm' | 'md' | 'lg'
  animated?: boolean
  striped?: boolean
  className?: string
}

const fillMap: Record<HealthStatus, string> = {
  ok: 'bg-gradient-to-l from-success to-emerald-400',
  warning: 'bg-gradient-to-l from-warning to-amber-400',
  critical: 'bg-gradient-to-l from-danger to-rose-500',
  neutral: 'bg-gradient-to-l from-primary-500 to-cyan-400',
  unknown: 'bg-gradient-to-l from-primary-500 to-cyan-400',
}

const trackMap: Record<HealthStatus, string> = {
  ok: 'bg-success-light',
  warning: 'bg-warning-light',
  critical: 'bg-danger-light',
  neutral: 'bg-primary-100',
  unknown: 'bg-primary-100',
}

const sizeMap = { xs: 'h-1', sm: 'h-1.5', md: 'h-2', lg: 'h-3' }

export function ProgressBar({
  value,
  max = 100,
  label,
  sublabel,
  showValue,
  status = 'neutral',
  size = 'md',
  animated = true,
  className,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {(label || showValue || sublabel) && (
        <div className="flex items-center justify-between">
          <div>
            {label && (
              <span className="text-sm font-medium text-text-secondary">
                {label}
              </span>
            )}
            {sublabel && (
              <span className="text-xs text-text-muted mr-2">{sublabel}</span>
            )}
          </div>
          {showValue && (
            <span
              className={cn(
                'text-sm font-bold num-display',
                status === 'ok' && 'text-success-dark',
                status === 'warning' && 'text-warning-dark',
                status === 'critical' && 'text-danger-dark',
                status === 'neutral' && 'text-primary-600'
              )}
            >
              {Math.round(percent)}٪
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          trackMap[status],
          sizeMap[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full',
            fillMap[status],
            animated && 'transition-all duration-700 ease-out'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

// ─── Segmented Progress ────────────────────────────────────────────────────
interface SegmentedProgressProps {
  segments: Array<{ value: number; color: string; label?: string }>
  max: number
  className?: string
}

export function SegmentedProgress({ segments, max, className }: SegmentedProgressProps) {
  return (
    <div className={cn('flex items-center gap-0.5 w-full h-2 rounded-full overflow-hidden', className)}>
      {segments.map((seg, i) => {
        const width = Math.min(100, (seg.value / max) * 100)
        return (
          <div
            key={i}
            className="h-full transition-all duration-700 first:rounded-r-full last:rounded-l-full"
            style={{ width: `${width}%`, backgroundColor: seg.color }}
          />
        )
      })}
    </div>
  )
}