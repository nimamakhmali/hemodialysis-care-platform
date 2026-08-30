'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@lib/utils/cn'

const buttonVariants = cva(
  [
    'relative inline-flex items-center justify-center gap-2',
    'font-semibold tracking-tight select-none',
    'transition-all duration-200 ease-smooth',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-primary-400',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'active:scale-[0.97]',
    'overflow-hidden',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-gradient-to-l from-primary-500 to-primary-600',
          'hover:from-primary-600 hover:to-primary-700',
          'text-white shadow-soft hover:shadow-md',
          'border border-primary-600/20',
          'before:absolute before:inset-0',
          'before:bg-gradient-to-t before:from-black/10 before:to-transparent',
          'before:opacity-0 hover:before:opacity-100',
          'before:transition-opacity before:duration-200',
        ],
        secondary: [
          'bg-primary-50 hover:bg-primary-100',
          'text-primary-700 hover:text-primary-800',
          'border border-primary-200 hover:border-primary-300',
          'shadow-xs hover:shadow-soft',
        ],
        outline: [
          'bg-white hover:bg-surface',
          'text-text-secondary hover:text-primary-600',
          'border border-border hover:border-primary-300',
          'shadow-xs hover:shadow-soft',
        ],
        ghost: [
          'bg-transparent hover:bg-surface',
          'text-text-tertiary hover:text-primary-600',
          'border border-transparent hover:border-border-subtle',
        ],
        danger: [
          'bg-gradient-to-l from-danger to-red-600',
          'hover:from-red-600 hover:to-red-700',
          'text-white shadow-soft hover:shadow-danger',
          'border border-red-600/20',
        ],
        success: [
          'bg-gradient-to-l from-success to-green-600',
          'hover:from-green-600 hover:to-green-700',
          'text-white shadow-soft hover:shadow-success',
          'border border-green-600/20',
        ],
        warning: [
          'bg-gradient-to-l from-warning to-amber-500',
          'hover:from-amber-500 hover:to-amber-600',
          'text-white shadow-soft hover:shadow-warning',
          'border border-amber-500/20',
        ],
        azure: [
          'bg-gradient-azure text-white',
          'hover:brightness-105',
          'shadow-glow-sm hover:shadow-glow',
          'border border-primary-700/20',
        ],
        'ghost-danger': [
          'bg-transparent hover:bg-danger-light',
          'text-danger hover:text-danger-dark',
          'border border-transparent hover:border-danger-border',
        ],
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-lg',
        sm: 'h-8 px-3 text-sm rounded-lg',
        md: 'h-10 px-4 text-sm rounded-xl',
        lg: 'h-11 px-5 text-base rounded-xl',
        xl: 'h-13 px-7 text-base rounded-2xl',
        icon: 'h-10 w-10 rounded-xl',
        'icon-sm': 'h-8 w-8 rounded-lg',
        'icon-lg': 'h-11 w-11 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant, size }),
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
            {loadingText && (
              <span>{loadingText}</span>
            )}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="flex-shrink-0 flex items-center">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className="flex-shrink-0 flex items-center">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'