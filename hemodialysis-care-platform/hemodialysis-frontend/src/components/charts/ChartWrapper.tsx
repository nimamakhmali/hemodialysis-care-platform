'use client'

import { cn } from '@lib/utils/cn'
import { Card } from '@components/ui/Card'

interface ChartWrapperProps {
  title: string
  subtitle?: string
  height?: number
  children: React.ReactNode
  actions?: React.ReactNode
  badge?: React.ReactNode
  className?: string
  isLoading?: boolean
  isEmpty?: boolean
  emptyMessage?: string
  headerExtra?: React.ReactNode
  noPadding?: boolean
}

export function ChartWrapper({
  title,
  subtitle,
  height = 280,
  children,
  actions,
  badge,
  className,
  isLoading,
  isEmpty,
  emptyMessage = 'داده‌ای برای نمایش وجود ندارد',
  headerExtra,
  noPadding,
}: ChartWrapperProps) {
  return (
    <Card
      variant="white"
      padding={noPadding ? 'none' : 'md'}
      className={cn('overflow-hidden', className)}
      glow
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-start justify-between gap-3 mb-4',
          noPadding && 'px-5 pt-5'
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
          )}
          {headerExtra && <div className="mt-2">{headerExtra}</div>}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>

      {/* Chart Area */}
      <div
        className={cn(
          'relative w-full',
          noPadding && 'px-5 pb-5'
        )}
        style={{ height }}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-primary-100" />
                <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-t-primary-500 animate-spin" />
              </div>
              <p className="text-xs text-text-muted">در حال بارگذاری...</p>
            </div>
          </div>
        ) : isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center border border-border-subtle">
              <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <p className="text-xs text-text-muted text-center max-w-[160px]">
              {emptyMessage}
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  )
}