import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@lib/utils/cn'

type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  description?: string
  icon?: React.ReactNode
  onClose?: () => void
  className?: string
  children?: React.ReactNode
  compact?: boolean
}

const variantConfig = {
  info: {
    wrapper: 'bg-info-light border-info-border text-info-dark',
    icon: <Info className="h-4.5 w-4.5 flex-shrink-0" />,
    iconColor: 'text-info',
  },
  success: {
    wrapper: 'bg-success-light border-success-border text-success-dark',
    icon: <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0" />,
    iconColor: 'text-success',
  },
  warning: {
    wrapper: 'bg-warning-light border-warning-border text-warning-dark',
    icon: <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0" />,
    iconColor: 'text-warning',
  },
  danger: {
    wrapper: 'bg-danger-light border-danger-border text-danger-dark',
    icon: <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />,
    iconColor: 'text-danger',
  },
}

export function Alert({
  variant = 'info',
  title,
  description,
  icon,
  onClose,
  className,
  children,
  compact,
}: AlertProps) {
  const config = variantConfig[variant]

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-xl border',
        compact ? 'p-3' : 'p-4',
        config.wrapper,
        className
      )}
    >
      <span className={cn('mt-0.5', config.iconColor)}>
        {icon ?? config.icon}
      </span>

      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-semibold leading-snug">{title}</p>
        )}
        {description && (
          <p className={cn('text-sm leading-relaxed opacity-90', title && 'mt-1')}>
            {description}
          </p>
        )}
        {children && (
          <div className={cn('text-sm', title && 'mt-1')}>{children}</div>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className={cn(
            'flex-shrink-0 p-1 rounded-lg opacity-60 hover:opacity-100',
            'transition-opacity duration-150'
          )}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}