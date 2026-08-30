'use client'

import { cn } from '@lib/utils/cn'
import { SparklineChart } from '@components/charts/SparklineChart'
import { TrendIndicator } from './TrendIndicator'
import type { HealthStatus, TrendDirection } from '@appTypes/common.types'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  status?: HealthStatus
  trend?: { direction: TrendDirection; text?: string; change?: number }
  icon?: React.ReactNode
  subtitle?: string
  sparklineData?: Array<{ value: number | null }>
  onClick?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  badge?: React.ReactNode
}

const statusConfig: Record<
  HealthStatus,
  {
    wrapper: string
    valueColor: string
    iconBg: string
    border: string
    glowColor: string
  }
> = {
  ok: {
    wrapper: 'bg-gradient-to-br from-white to-success-light/30',
    valueColor: 'text-success-dark',
    iconBg: 'bg-success-light border-success-border',
    border: 'border-success-border',
    glowColor: 'rgba(34,197,94,0.06)',
  },
  warning: {
    wrapper: 'bg-gradient-to-br from-white to-warning-light/30',
    valueColor: 'text-warning-dark',
    iconBg: 'bg-warning-light border-warning-border',
    border: 'border-warning-border',
    glowColor: 'rgba(245,158,11,0.06)',
  },
  critical: {
    wrapper: 'bg-gradient-to-br from-white to-danger-light/30',
    valueColor: 'text-danger-dark',
    iconBg: 'bg-danger-light border-danger-border',
    border: 'border-danger-border',
    glowColor: 'rgba(239,68,68,0.06)',
  },
  neutral: {
    wrapper: 'bg-gradient-to-br from-white to-surface',
    valueColor: 'text-primary-600',
    iconBg: 'bg-primary-50 border-primary-200',
    border: 'border-border-subtle',
    glowColor: 'rgba(14,165,233,0.06)',
  },
  unknown: {
    wrapper: 'bg-surface',
    valueColor: 'text-text-primary',
    iconBg: 'bg-surface border-border-subtle',
    border: 'border-border-subtle',
    glowColor: 'transparent',
  },
}

const sizeMap = {
  sm: { wrapper: 'p-3', value: 'text-xl', label: 'text-xs', unit: 'text-xs' },
  md: { wrapper: 'p-4', value: 'text-2xl', label: 'text-xs', unit: 'text-sm' },
  lg: { wrapper: 'p-5', value: 'text-3xl', label: 'text-sm', unit: 'text-base' },
}

export function MetricCard({
  label,
  value,
  unit,
  status = 'neutral',
  trend,
  icon,
  subtitle,
  sparklineData,
  onClick,
  className,
  size = 'md',
  badge,
}: MetricCardProps) {
  const cfg = statusConfig[status]
  const sz = sizeMap[size]

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-2xl border overflow-hidden',
        'transition-all duration-300',
        cfg.wrapper,
        cfg.border,
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
        sz.wrapper,
        className
      )}
      style={{
        boxShadow: `0 2px 16px ${cfg.glowColor}, 0 1px 4px rgba(0,0,0,0.04)`,
      }}
    >
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-20 pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-3">
        {/* Top Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <div
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-xl border',
                  'flex items-center justify-center',
                  cfg.iconBg
                )}
              >
                <span className="text-sm">{icon}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className={cn('font-medium text-text-muted truncate', sz.label)}>
                {label}
              </p>
              {subtitle && (
                <p className="text-[10px] text-text-disabled mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {badge}
        </div>

        {/* Value Row */}
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              'font-black leading-none num-display tracking-tight',
              sz.value,
              cfg.valueColor
            )}
          >
            {value === null || value === undefined ? '—' : value}
          </span>
          {unit && (
            <span className={cn('font-medium text-text-muted', sz.unit)}>
              {unit}
            </span>
          )}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 1 && (
          <SparklineChart
            data={sparklineData}
            status={status}
            height={36}
            strokeWidth={1.8}
          />
        )}

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-1.5">
            <TrendIndicator direction={trend.direction} size="sm" />
            {trend.text && (
              <span className="text-[11px] text-text-muted">{trend.text}</span>
            )}
            {trend.change !== undefined && (
              <span
                className={cn(
                  'text-[11px] font-semibold num-display',
                  trend.direction === 'increasing' && status !== 'ok'
                    ? 'text-danger'
                    : trend.direction === 'decreasing' && status !== 'ok'
                      ? 'text-warning'
                      : 'text-text-muted'
                )}
              >
                {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}