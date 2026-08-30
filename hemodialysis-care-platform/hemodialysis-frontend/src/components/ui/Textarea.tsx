'use client'

import { forwardRef } from 'react'
import { cn } from '@lib/utils/cn'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  wrapperClassName?: string
  optional?: boolean
  showCount?: boolean
  maxLength?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      wrapperClassName,
      optional,
      showCount,
      maxLength,
      className,
      value,
      ...props
    },
    ref
  ) => {
    const charCount = typeof value === 'string' ? value.length : 0

    return (
      <div className={cn('group flex flex-col gap-1.5', wrapperClassName)}>
        {(label || optional) && (
          <div className="flex items-center justify-between">
            {label && (
              <label className="text-sm font-medium text-text-secondary group-focus-within:text-primary-600 transition-colors duration-150">
                {label}
              </label>
            )}
            {optional && (
              <span className="text-xs text-text-muted">اختیاری</span>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          value={value}
          maxLength={maxLength}
          className={cn(
            'w-full rounded-xl px-4 py-3',
            'bg-white text-sm text-text-primary',
            'placeholder:text-text-disabled',
            'border transition-all duration-200',
            'focus:outline-none focus:ring-2',
            'resize-none min-h-[100px]',
            'leading-relaxed',
            error
              ? 'border-danger/60 focus:ring-danger/20 focus:border-danger'
              : 'border-border hover:border-primary-300 focus:ring-primary-500/20 focus:border-primary-400',
            className
          )}
          {...props}
        />

        <div className="flex items-center justify-between min-h-[16px]">
          <div>
            {error && (
              <p className="text-xs text-danger">{error}</p>
            )}
            {hint && !error && (
              <p className="text-xs text-text-muted">{hint}</p>
            )}
          </div>
          {showCount && maxLength && (
            <p
              className={cn(
                'text-xs tabular-nums',
                charCount >= maxLength
                  ? 'text-danger'
                  : charCount >= maxLength * 0.8
                    ? 'text-warning'
                    : 'text-text-muted'
              )}
            >
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'