import { cn } from '@/lib/utils/cn'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  className,
}: EmptyStateProps) {
  const sizeMap = {
    sm: { wrapper: 'py-8', icon: 'h-10 w-10', title: 'text-sm', desc: 'text-xs' },
    md: { wrapper: 'py-12', icon: 'h-14 w-14', title: 'text-base', desc: 'text-sm' },
    lg: { wrapper: 'py-16', icon: 'h-16 w-16', title: 'text-lg', desc: 'text-base' },
  }

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
            'flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4',
            s.icon
          )}
        >
          {icon}
        </div>
      )}
      <p className={cn('font-semibold text-slate-700', s.title)}>{title}</p>
      {description && (
        <p className={cn('text-slate-400 mt-1.5 max-w-xs leading-relaxed', s.desc)}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}