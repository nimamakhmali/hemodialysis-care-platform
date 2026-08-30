'use client'

import { cn } from '@lib/utils/cn'
import type { HealthStatus } from '@appTypes/common.types'

interface RangeIndicatorProps {
  value: number
  min: number
  max: number
  criticalLow?: number
  criticalHigh?: number
  normalLow?: number
  normalHigh?: number
  unit?: string
  label?: string
  status?: HealthStatus
  className?: string
}

export function RangeIndicator({
  value,
  min,
  max,
  criticalLow,
  criticalHigh,
  normalLow,
  normalHigh,
  unit,
  label,
  status = 'neutral',
  className,
}: RangeIndicatorProps) {
  const range = max - min
  const clampedValue = Math.min(max, Math.max(min, value))
  const valuePercent = ((clampedValue - min) / range) * 100

  const normalLowPercent = normalLow ? ((normalLow - min) / range) * 100 : 0
  const normalHighPercent = normalHigh ? ((normalHigh - min) / range) * 100 : 100
  const critLowPercent = criticalLow ? ((criticalLow - min) / range) * 100 : 0
  const critHighPercent = criticalHigh ? ((criticalHigh - min) / range) * 100 : 100

  const indicatorColor = {
    ok: '#22C55E',
    warning: '#F59E0B',
    critical: '#EF4444',
    neutral: '#0EA5E9',
    unknown: '#94A3B8',
  }[status]

  return (
    <div className={cn('w-full space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-muted">{label}</span>
          <span className="text-xs font-bold text-text-primary num-display">
            {value} {unit}
          </span>
        </div>
      )}

      <div className="relative h-3 rounded-full overflow-hidden bg-surface border border-border-subtle">
        {/* Critical zones */}
        {criticalLow && (
          <div
            className="absolute top-0 bottom-0 bg-danger-light/70"
            style={{ left: 0, width: `${critLowPercent}%` }}
          />
        )}
        {criticalHigh && (
          <div
            className="absolute top-0 bottom-0 bg-danger-light/70"
            style={{ left: `${critHighPercent}%`, right: 0 }}
          />
        )}

        {/* Normal zone */}
        <div
          className="absolute top-0 bottom-0 bg-success-light/60"
          style={{
            left: `${normalLowPercent}%`,
            width: `${normalHighPercent - normalLowPercent}%`,
          }}
        />

        {/* Value indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 transition-all duration-500"
          style={{ left: `${valuePercent}%` }}
        >
          <div
            className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md"
            style={{
              backgroundColor: indicatorColor,
              boxShadow: `0 0 0 2px white, 0 0 8px ${indicatorColor}60`,
            }}
          />
        </div>
      </div>

      {/* Scale labels */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-text-disabled num-display">{min}</span>
        {normalLow && normalHigh && (
          <span className="text-[10px] text-success-dark font-medium">
            طبیعی: {normalLow}–{normalHigh}
          </span>
        )}
        <span className="text-[10px] text-text-disabled num-display">{max}</span>
      </div>
    </div>
  )
}