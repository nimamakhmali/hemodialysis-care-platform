import { cn } from '@lib/utils/cn'

interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  label?: string
  className?: string
  variant?: 'default' | 'dashed' | 'gradient'
}

export function Divider({
  orientation = 'horizontal',
  label,
  className,
  variant = 'gradient',
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        className={cn(
          'self-stretch w-px',
          variant === 'gradient'
            ? 'bg-gradient-to-b from-transparent via-border to-transparent'
            : 'bg-border',
          variant === 'dashed' && 'border-r border-dashed border-border bg-transparent',
          className
        )}
      />
    )
  }

  if (label) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="flex-1 h-px bg-gradient-to-l from-border via-border to-transparent" />
        <span className="text-xs font-medium text-text-muted whitespace-nowrap px-1">
          {label}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-border via-border to-transparent" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'w-full h-px',
        variant === 'gradient'
          ? 'bg-gradient-to-r from-transparent via-border to-transparent'
          : variant === 'dashed'
            ? 'border-t border-dashed border-border'
            : 'bg-border',
        className
      )}
    />
  )
}