import { cn } from '@lib/utils/cn'

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'white' | 'muted'
  className?: string
}

const sizeMap = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
  xl: 'w-12 h-12 border-4',
}

const variantMap = {
  primary: 'border-primary-200 border-t-primary-500',
  white: 'border-white/30 border-t-white',
  muted: 'border-border border-t-text-muted',
}

export function Spinner({ size = 'md', variant = 'primary', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="در حال بارگذاری"
      className={cn(
        'rounded-full animate-spin flex-shrink-0',
        sizeMap[size],
        variantMap[variant],
        className
      )}
    />
  )
}

// ─── Dots Spinner ─────────────────────────────────────────────────────────
interface DotsSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function DotsSpinner({ size = 'md', className }: DotsSpinnerProps) {
  const dotSize = { sm: 'w-1.5 h-1.5', md: 'w-2 h-2', lg: 'w-3 h-3' }[size]

  return (
    <div className={cn('flex items-center gap-1.5', className)} role="status">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full bg-primary-400 animate-pulse-soft',
            dotSize
          )}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  )
}