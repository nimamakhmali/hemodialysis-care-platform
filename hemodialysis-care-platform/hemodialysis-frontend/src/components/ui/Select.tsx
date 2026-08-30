'use client'

import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@lib/utils/cn'
import type { SelectOption } from '@appTypes/common.types'

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
  wrapperClassName?: string
  optional?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder,
      wrapperClassName,
      optional,
      className,
      required,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('group flex flex-col gap-1.5', wrapperClassName)}>
        {(label || optional) && (
          <div className="flex items-center justify-between">
            {label && (
              <label className="text-sm font-medium text-text-secondary group-focus-within:text-primary-600 transition-colors duration-150">
                {label}
                {required && <span className="text-danger mr-1 text-xs">*</span>}
              </label>
            )}
            {optional && <span className="text-xs text-text-muted">اختیاری</span>}
          </div>
        )}

        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full h-10 pr-4 pl-9 rounded-xl appearance-none',
              'bg-white text-sm text-text-primary',
              'border transition-all duration-200',
              'focus:outline-none focus:ring-2',
              'disabled:bg-surface disabled:cursor-not-allowed',
              'cursor-pointer',
              error
                ? 'border-danger/60 focus:ring-danger/20 focus:border-danger'
                : 'border-border hover:border-primary-300 focus:ring-primary-500/20 focus:border-primary-400',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={String(opt.value)}
                value={String(opt.value)}
                disabled={opt.disabled}
              >
                {opt.label}
              </option>
            ))}
          </select>

          <ChevronDown
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2',
              'h-4 w-4 text-text-muted pointer-events-none',
              'transition-transform duration-200',
              'group-focus-within:text-primary-500'
            )}
          />
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'