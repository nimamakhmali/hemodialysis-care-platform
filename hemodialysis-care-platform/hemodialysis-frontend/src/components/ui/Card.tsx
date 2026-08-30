'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@lib/utils/cn'

const cardVariants = cva(
  'relative overflow-hidden transition-all duration-300',
  {
    variants: {
      variant: {
        white: [
          'bg-white border border-border-subtle',
          'shadow-card',
        ],
        surface: [
          'bg-surface border border-border-subtle',
          'shadow-soft',
        ],
        azure: [
          'border border-border shadow-card',
          'bg-gradient-to-br from-white via-surface to-primary-50',
        ],
        gradient: [
          'border border-border shadow-md',
          'bg-gradient-to-br from-surface-200 via-surface to-white',
        ],
        glass: [
          'glass border-white/30 shadow-lg',
        ],
        'glass-azure': [
          'glass-azure shadow-md',
        ],
        elevated: [
          'bg-white border border-border-subtle',
          'shadow-xl',
        ],
        flat: [
          'bg-surface border border-border-subtle',
          'shadow-none',
        ],
        bordered: [
          'bg-white border-2 border-border',
          'shadow-none',
        ],
        'primary-glow': [
          'bg-white border border-primary-200',
          'shadow-glow-sm',
        ],
      },
      padding: {
        none: '',
        xs: 'p-3',
        sm: 'p-4',
        md: 'p-5',
        lg: 'p-6',
        xl: 'p-8',
      },
      radius: {
        md: 'rounded-xl',
        lg: 'rounded-2xl',
        xl: 'rounded-3xl',
      },
      hover: {
        none: '',
        lift: 'cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-primary-200',
        glow: 'cursor-pointer hover:shadow-glow hover:border-primary-300',
        scale: 'cursor-pointer hover:scale-[1.01] hover:shadow-md',
        border: 'cursor-pointer hover:border-primary-300 hover:shadow-md',
      },
    },
    defaultVariants: {
      variant: 'white',
      padding: 'md',
      radius: 'lg',
      hover: 'none',
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  glow?: boolean
  glowColor?: 'azure' | 'cyan' | 'teal' | 'success' | 'warning' | 'danger'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, radius, hover, glow, glowColor = 'azure', children, ...props }, ref) => {
    const glowClass = {
      azure: 'glow-top-right',
      cyan: '',
      teal: '',
      success: '',
      warning: '',
      danger: '',
    }[glowColor]

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, radius, hover }), className)}
        {...props}
      >
        {glow && (
          <div
            className={cn(
              'absolute inset-0 pointer-events-none z-0 opacity-60',
              glowClass
            )}
          />
        )}
        <div className={cn(glow && 'relative z-[1]')}>{children}</div>
      </div>
    )
  }
)
Card.displayName = 'Card'

// ─── Card Sub-components ───────────────────────────────────────────────────
export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between pb-4 mb-4',
        'border-b border-border-subtle',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold text-text-primary', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardSubtitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-text-muted mt-0.5', className)} {...props}>
      {children}
    </p>
  )
}

export function CardBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between pt-4 mt-4',
        'border-t border-border-subtle',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}