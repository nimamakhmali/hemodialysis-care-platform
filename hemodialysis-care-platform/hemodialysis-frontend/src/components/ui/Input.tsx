'use client'

import { forwardRef, useState } from 'react'
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@lib/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  success?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  rightAction?: React.ReactNode
  wrapperClassName?: string
  labelClassName?: string
  showPasswordToggle?: boolean
  optional?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      success,
      leftIcon,
      rightIcon,
      rightAction,
      wrapperClassName,
      labelClassName,
      showPasswordToggle,
      optional,
      className,
      type = 'text',
      required,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const inputId = id ?? label?.replace(/\s+/g, '-')

    const inputType =
      showPasswordToggle ? (showPassword ? 'text' : 'password') : type

    const hasLeftPad = !!leftIcon
    const hasRightPad = !!rightIcon || !!rightAction || showPasswordToggle

    const borderClass = error
      ? 'border-danger/60 focus:ring-danger/20 focus:border-danger'
      : success
        ? 'border-success/60 focus:ring-success/20 focus:border-success'
        : 'border-border hover:border-primary-300 focus:ring-primary-500/20 focus:border-primary-400'

    return (
      <div className={cn('group flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className={cn(
                'text-sm font-medium text-text-secondary',
                'transition-colors duration-150',
                'group-focus-within:text-primary-600',
                labelClassName
              )}
            >
              {label}
              {required && (
                <span className="text-danger mr-1 text-xs">*</span>
              )}
            </label>
            {optional && (
              <span className="text-xs text-text-muted">اختیاری</span>
            )}
          </div>
        )}

        <div className="relative flex items-center">
          {/* Left Icon */}
          {leftIcon && (
            <div
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 z-10',
                'text-text-muted transition-colors duration-150',
                'group-focus-within:text-primary-500',
                error && 'text-danger',
                success && 'text-success'
              )}
            >
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled}
            required={required}
            className={cn(
              'w-full h-10 rounded-xl',
              'bg-white text-sm text-text-primary',
              'placeholder:text-text-disabled',
              'border transition-all duration-200',
              'focus:outline-none focus:ring-2',
              'disabled:bg-surface disabled:cursor-not-allowed',
              'disabled:text-text-disabled disabled:border-border-subtle',
              hasLeftPad ? 'pr-10' : 'pr-4',
              hasRightPad ? 'pl-10' : 'pl-4',
              borderClass,
              className
            )}
            {...props}
          />

          {/* Right Side */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1">
            {/* Status Icons */}
            {error && !showPasswordToggle && !rightIcon && (
              <AlertCircle className="h-4 w-4 text-danger flex-shrink-0" />
            )}
            {success && !showPasswordToggle && !rightIcon && (
              <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
            )}

            {/* Custom Right Icon */}
            {rightIcon && (
              <span className="text-text-muted flex items-center">
                {rightIcon}
              </span>
            )}

            {/* Right Action */}
            {rightAction}

            {/* Password Toggle */}
            {showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className={cn(
                  'text-text-muted hover:text-primary-500',
                  'transition-colors duration-150',
                  'focus:outline-none'
                )}
                tabIndex={-1}
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Helper Text */}
        {(error || hint || success) && (
          <div className="flex items-center gap-1.5 min-h-[16px]">
            {error && (
              <p className="text-xs text-danger flex items-center gap-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {error}
              </p>
            )}
            {success && !error && (
              <p className="text-xs text-success flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                {success}
              </p>
            )}
            {hint && !error && !success && (
              <p className="text-xs text-text-muted">{hint}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'