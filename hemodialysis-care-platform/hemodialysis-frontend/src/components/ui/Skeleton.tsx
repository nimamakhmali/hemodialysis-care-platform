import { cn } from '@lib/utils/cn'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'text'
  width?: string | number
  height?: string | number
  lines?: number
}

export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  lines,
  style,
  ...props
}: SkeletonProps) {
  if (variant === 'text' && lines) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(i === lines - 1 && 'w-3/4', className)}
            height={height ?? 14}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'shimmer',
        variant === 'circular' ? 'rounded-full' : 'rounded-xl',
        className
      )}
      style={{ width, height, ...style }}
      {...props}
    />
  )
}

// ─── Preset Skeletons ──────────────────────────────────────────────────────
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton width={120} height={16} />
        <Skeleton width={60} height={24} className="rounded-full" />
      </div>
      <Skeleton width={80} height={36} />
      <Skeleton width="60%" height={12} />
      <div className="flex gap-2 pt-1">
        <Skeleton width={48} height={10} />
        <Skeleton width={48} height={10} />
      </div>
    </div>
  )
}

export function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border-subtle p-4 space-y-3', className)}>
      <div className="flex justify-between items-center">
        <Skeleton width={80} height={12} />
        <Skeleton width={32} height={32} className="rounded-xl" />
      </div>
      <Skeleton width={64} height={32} />
      <Skeleton width="50%" height={10} />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5, className }: { cols?: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 px-4 py-3.5', className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          className={cn('flex-1', i === 0 && 'max-w-[120px]')}
        />
      ))}
    </div>
  )
}

export function PatientCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('card p-5 space-y-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton width={40} height={40} className="rounded-xl" />
          <div className="space-y-2">
            <Skeleton width={120} height={14} />
            <Skeleton width={80} height={11} />
          </div>
        </div>
        <Skeleton width={56} height={22} className="rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton width={40} height={10} />
            <Skeleton width={56} height={16} />
          </div>
        ))}
      </div>
      <Skeleton height={36} className="rounded-xl" />
    </div>
  )
}

export function ChartSkeleton({ className, height = 280 }: { className?: string; height?: number }) {
  return (
    <div className={cn('card p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <Skeleton width={140} height={14} />
          <Skeleton width={100} height={11} />
        </div>
        <Skeleton width={80} height={28} className="rounded-lg" />
      </div>
      <Skeleton height={height} className="rounded-xl" />
    </div>
  )
}