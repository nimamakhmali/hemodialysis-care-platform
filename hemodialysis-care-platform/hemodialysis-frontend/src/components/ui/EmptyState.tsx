import { cn } from '@lib/utils/cn'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: { wrapper: 'py-8 gap-3', icon: 'w-10 h-10', title: 'text-sm', desc: 'text-xs' },
  md: { wrapper: 'py-12 gap-4', icon: 'w-14 h-14', title: 'text-base', desc: 'text-sm' },
  lg: { wrapper: 'py-16 gap-5', icon: 'w-20 h-20', title: 'text-lg', desc: 'text-base' },
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const s = sizeMap[size]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        s.wrapper,
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-2xl',
            'bg-gradient-to-br from-surface to-primary-100',
            'border border-border-subtle shadow-soft',
            s.icon
          )}
        >
          <span className="text-primary-400 text-2xl">{icon}</span>
        </div>
      )}

      <div className="max-w-xs space-y-1.5">
        <h3 className={cn('font-semibold text-text-primary', s.title)}>
          {title}
        </h3>
        {description && (
          <p className={cn('text-text-muted leading-relaxed', s.desc)}>
            {description}
          </p>
        )}
      </div>

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button
              variant="primary"
              size="md"
              onClick={action.onClick}
              leftIcon={action.icon}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              size="md"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}