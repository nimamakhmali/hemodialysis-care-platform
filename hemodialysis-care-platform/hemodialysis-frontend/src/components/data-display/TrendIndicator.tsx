import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@lib/utils/cn'
import type { TrendDirection } from '@appTypes/common.types'

interface TrendIndicatorProps {
  direction: TrendDirection
  size?: 'xs' | 'sm' | 'md'
  inverted?: boolean
  showLabel?: boolean
  className?: string
}

const dirConfig = {
  increasing: {
    icon: TrendingUp,
    default: { text: 'text-danger', bg: 'bg-danger-light', label: 'صعودی' },
    inverted: { text: 'text-success', bg: 'bg-success-light', label: 'صعودی' },
  },
  decreasing: {
    icon: TrendingDown,
    default: { text: 'text-success', bg: 'bg-success-light', label: 'نزولی' },
    inverted: { text: 'text-danger', bg: 'bg-danger-light', label: 'نزولی' },
  },
  stable: {
    icon: Minus,
    default: { text: 'text-text-muted', bg: 'bg-surface', label: 'پایدار' },
    inverted: { text: 'text-text-muted', bg: 'bg-surface', label: 'پایدار' },
  },
}

const sizeMap = {
  xs: { icon: 12, wrapper: 'w-4 h-4 rounded-md', text: 'text-[10px]' },
  sm: { icon: 14, wrapper: 'w-5 h-5 rounded-md', text: 'text-xs' },
  md: { icon: 16, wrapper: 'w-6 h-6 rounded-lg', text: 'text-sm' },
}

export function TrendIndicator({
  direction,
  size = 'sm',
  inverted = false,
  showLabel = false,
  className,
}: TrendIndicatorProps) {
  const config = dirConfig[direction]
  const style = inverted ? config.inverted : config.default
  const sz = sizeMap[size]
  const Icon = config.icon

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div
        className={cn(
          'flex items-center justify-center flex-shrink-0',
          sz.wrapper,
          style.bg
        )}
      >
        <Icon size={sz.icon} className={style.text} strokeWidth={2.5} />
      </div>
      {showLabel && (
        <span className={cn('font-medium', style.text, sz.text)}>
          {style.label}
        </span>
      )}
    </div>
  )
}