'use client'

import { forwardRef } from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '@lib/utils/cn'

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  indeterminate?: boolean
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, indeterminate, error, className, checked, ...props }, ref) => {
    return (
      <label
        className={cn(
          'flex items-start gap-3 cursor-pointer group',
          props.disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            className="sr-only peer"
            {...props}
          />
          <div
            className={cn(
              'w-5 h-5 rounded-md border-2 flex items-center justify-center',
              'transition-all duration-200',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400/30',
              checked || indeterminate
                ? 'bg-gradient-to-br from-primary-500 to-primary-600 border-primary-600 shadow-glow-sm'
                : 'bg-white border-border group-hover:border-primary-400',
              error && !checked && 'border-danger',
              className
            )}
          >
            {checked && !indeterminate && (
              <Check className="h-3 w-3 text-white stroke-[3]" />
            )}
            {indeterminate && (
              <Minus className="h-3 w-3 text-white stroke-[3]" />
            )}
          </div>
        </div>

        {(label || description) && (
          <div className="min-w-0">
            {label && (
              <p className="text-sm font-medium text-text-primary leading-tight">
                {label}
              </p>
            )}
            {description && (
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'