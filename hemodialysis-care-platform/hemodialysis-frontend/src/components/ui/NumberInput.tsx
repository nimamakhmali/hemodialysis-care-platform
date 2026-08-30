'use client'

import { forwardRef } from 'react'
import { cn } from '@lib/utils/cn'
import type { HealthStatus } from '@appTypes/common.types'

interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string
  unit?: string
  error?: string
  hint?: string
  status?: HealthStatus
  refRangeLow?: number
  refRangeHigh?: number
  onValueChange?: (value: number | '') => void
  wrapperClassName?: string
  optional?: boolean
}

const statusBorderMap: Record<HealthStatus, string> = {
  ok: 'border-success/50 focus:border-success focus:ring-success/20',
  warning: 'border-warning/50 focus:border-warning focus:ring-warning/20',
  critical: 'border-danger/50 focus:border-danger focus:ring-danger/20',
  neutral: 'border-border hover:border-primary-300 focus:border-primary-400 focus:ring-primary-500/20',
  unknown: 'border-border hover:border-primary-300 focus:border-primary-400 focus:ring-primary-500/20',
}

const statusBgMap: Record<HealthStatus, string> = {
  ok: 'bg-success-light/30',
  warning: 'bg-warning-light/30',
  critical: 'bg-danger-light/30',
  neutral: 'bg-white',
  unknown: 'bg-white',
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      label,
      unit,
      error,
      hint,
      status = 'neutral',
      refRangeLow,
      refRangeHigh,
      onChange,
      wrapperClassName,
      optional,
      className,
      ...props
    },
    ref
  ) => {
    const borderClass = error
      ? 'border-danger/60 focus:ring-danger/20 focus:border-danger'
      : statusBorderMap[status]

    const bgClass = error ? 'bg-danger-light/20' : statusBgMap[status]

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-muted">
              {label}
            </label>
            {optional && (
              <span className="text-[10px] text-text-disabled">اختیاری</span>
            )}
          </div>
        )}

        <div className="relative flex items-center">
          <input
            ref={ref}
            type="number"
            inputMode="decimal"
            className={cn(
              'w-full h-9 rounded-xl px-3',
              'text-sm font-medium text-text-primary num-display',
              'border transition-all duration-200',
              'focus:outline-none focus:ring-2',
              'placeholder:text-text-disabled',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              unit ? 'pl-14' : 'pl-3',
              bgClass,
              borderClass,
              className
            )}
            onChange={(e) => {
              const raw = e.target.value
              onValueChange?.(raw === '' ? '' : parseFloat(raw))
            }}
            {...props}
          />
          {unit && (
            <div
              className={cn(
                'absolute left-0 top-0 bottom-0',
                'flex items-center justify-center',
                'px-3 rounded-l-xl border-r',
                'text-xs font-medium text-text-muted',
                'bg-surface/80 border-border-subtle',
                'min-w-[3rem]'
              )}
            >
              {unit}
            </div>
          )}
        </div>

        {refRangeLow !== undefined && refRangeHigh !== undefined && (
          <p className="text-[10px] text-text-muted">
            مرجع: {refRangeLow} – {refRangeHigh}
          </p>
        )}

        {error && (
          <p className="text-xs text-danger">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-text-muted">{hint}</p>
        )}
      </div>
    )
  }
)

NumberInput.displayName = 'NumberInput'