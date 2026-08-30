import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-semibold transition-colors duration-150 whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-primary-100 text-primary-700 border border-primary-200',
        primary: 'bg-primary-500 text-white border border-primary-600/20',
        secondary: 'bg-primary-50 text-primary-600 border border-primary-200',
        success: 'bg-success-light text-success-dark border border-success-border',
        warning: 'bg-warning-light text-warning-dark border border-warning-border',
        danger: 'bg-danger-light text-danger-dark border border-danger-border',
        info: 'bg-info-light text-info-dark border border-info-border',
        neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
        cyan: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
        teal: 'bg-teal-100 text-teal-700 border border-teal-200',
        outline: 'bg-transparent text-text-secondary border border-border',
        ghost: 'bg-transparent text-text-muted border-transparent',
        azure: [
          'text-white border border-primary-600/20',
          'bg-gradient-to-l from-primary-500 to-cyan-500',
        ],
        'high-alert': [
          'bg-danger-light text-danger-dark border border-danger-border',
          'animate-pulse-soft',
        ],
      },
      size: {
        xs: 'text-[10px] px-1.5 py-0.5 rounded-md',
        sm: 'text-xs px-2 py-0.5 rounded-lg',
        md: 'text-xs px-2.5 py-1 rounded-lg',
        lg: 'text-sm px-3 py-1 rounded-xl',
      },
      rounded: {
        default: '',
        full: '!rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
      rounded: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  dotColor?: string
}

export function Badge({
  className,
  variant,
  size,
  rounded,
  dot,
  dotColor,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, rounded }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'flex-shrink-0 w-1.5 h-1.5 rounded-full',
            dotColor ?? 'bg-current'
          )}
        />
      )}
      {children}
    </span>
  )
}

// ─── Severity Badge ────────────────────────────────────────────────────────
import type { AlertSeverity } from '@appTypes/common.types'
import { ALERT_SEVERITY_FA } from '@config/constants'

interface SeverityBadgeProps {
  severity: AlertSeverity
  pulse?: boolean
  className?: string
}

export function SeverityBadge({ severity, pulse, className }: SeverityBadgeProps) {
  const config = {
    high: { variant: 'danger' as const, dot: true },
    medium: { variant: 'warning' as const, dot: true },
    low: { variant: 'info' as const, dot: true },
  }[severity]

  return (
    <Badge
      variant={config.variant}
      dot={config.dot}
      rounded="full"
      className={cn(pulse && severity === 'high' && 'animate-pulse-soft', className)}
    >
      {ALERT_SEVERITY_FA[severity]}
    </Badge>
  )
}