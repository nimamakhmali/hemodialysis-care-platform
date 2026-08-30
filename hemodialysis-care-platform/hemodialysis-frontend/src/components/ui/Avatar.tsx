import { cn } from '@lib/utils/cn'

interface AvatarProps {
  name?: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'azure' | 'cyan' | 'teal' | 'neutral'
  className?: string
  online?: boolean
}

const sizeMap = {
  xs: { container: 'w-6 h-6 rounded-lg text-[10px]', dot: 'w-1.5 h-1.5' },
  sm: { container: 'w-8 h-8 rounded-lg text-sm', dot: 'w-2 h-2' },
  md: { container: 'w-10 h-10 rounded-xl text-base', dot: 'w-2.5 h-2.5' },
  lg: { container: 'w-12 h-12 rounded-xl text-lg', dot: 'w-3 h-3' },
  xl: { container: 'w-16 h-16 rounded-2xl text-2xl', dot: 'w-3.5 h-3.5' },
}

const variantMap = {
  azure: 'bg-gradient-to-br from-primary-400 to-primary-600',
  cyan: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
  teal: 'bg-gradient-to-br from-teal-400 to-teal-600',
  neutral: 'bg-gradient-to-br from-slate-400 to-slate-600',
}

function getInitials(name?: string): string {
  if (!name) return '؟'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return parts[0][0] + parts[1][0]
  return parts[0][0] ?? '؟'
}

export function Avatar({
  name,
  src,
  size = 'md',
  variant = 'azure',
  className,
  online,
}: AvatarProps) {
  const { container, dot } = sizeMap[size]

  return (
    <div className={cn('relative flex-shrink-0', className)}>
      <div
        className={cn(
          'flex items-center justify-center',
          'text-white font-bold select-none',
          'ring-2 ring-white shadow-soft',
          variantMap[variant],
          container
        )}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover rounded-[inherit]"
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 left-0 rounded-full',
            'ring-2 ring-white',
            online ? 'bg-success' : 'bg-text-disabled',
            dot
          )}
        />
      )}
    </div>
  )
}