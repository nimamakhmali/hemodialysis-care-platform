'use client'

import { cn } from '@lib/utils/cn'
import type { AlertSeverity } from '@appTypes/common.types'

interface GaugeChartProps {
  value: number
  max?: number
  size?: number
  label?: string
  sublabel?: string
  severity?: AlertSeverity
  showValue?: boolean
  className?: string
  animated?: boolean
}

const severityConfig = {
  low: {
    gradient: ['#22C55E', '#16A34A'],
    track: '#DCFCE7',
    text: 'text-success-dark',
    glow: 'rgba(34,197,94,0.3)',
  },
  medium: {
    gradient: ['#F59E0B', '#D97706'],
    track: '#FEF3C7',
    text: 'text-warning-dark',
    glow: 'rgba(245,158,11,0.3)',
  },
  high: {
    gradient: ['#EF4444', '#DC2626'],
    track: '#FEE2E2',
    text: 'text-danger-dark',
    glow: 'rgba(239,68,68,0.3)',
  },
}

export function GaugeChart({
  value,
  max = 100,
  size = 160,
  label,
  sublabel,
  severity = 'low',
  showValue = true,
  className,
  animated = true,
}: GaugeChartProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  const config = severityConfig[severity]

  const strokeWidth = size * 0.1
  const radius = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size / 2

  // Semi-circle: starts at 180° ends at 0° (bottom half hidden)
  const startAngle = Math.PI           // 180°
  const endAngle = 2 * Math.PI        // 360° = 0°
  const arcRange = endAngle - startAngle  // π

  const valueAngle = startAngle + (percent / 100) * arcRange

  const describeArc = (start: number, end: number) => {
    const x1 = cx + radius * Math.cos(start)
    const y1 = cy + radius * Math.sin(start)
    const x2 = cx + radius * Math.cos(end)
    const y2 = cy + radius * Math.sin(end)
    const large = end - start > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`
  }

  const trackPath = describeArc(startAngle, endAngle)
  const valuePath = percent > 0
    ? describeArc(startAngle, valueAngle)
    : ''

  const gradId = `gauge-grad-${Math.random().toString(36).slice(2, 8)}`

  return (
    <div
      className={cn('flex flex-col items-center gap-2', className)}
      style={{ width: size }}
    >
      <div className="relative" style={{ width: size, height: size * 0.6 + strokeWidth }}>
        <svg
          width={size}
          height={size * 0.6 + strokeWidth}
          viewBox={`0 0 ${size} ${size * 0.6 + strokeWidth}`}
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={config.gradient[0]} />
              <stop offset="100%" stopColor={config.gradient[1]} />
            </linearGradient>
            <filter id={`gauge-glow-${gradId}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track */}
          <path
            d={trackPath}
            fill="none"
            stroke={config.track}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Arc */}
          {valuePath && (
            <path
              d={valuePath}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter={`url(#gauge-glow-${gradId})`}
              style={
                animated
                  ? {
                      strokeDasharray: 1000,
                      strokeDashoffset: 0,
                      animation: 'drawLine 1.2s ease-out forwards',
                    }
                  : undefined
              }
            />
          )}

          {/* Center Dot */}
          <circle
            cx={cx}
            cy={cy}
            r={strokeWidth * 0.4}
            fill={config.gradient[0]}
            opacity={0.6}
          />

          {/* Needle */}
          {(() => {
            const nx = cx + (radius - strokeWidth / 2 - 4) * Math.cos(valueAngle)
            const ny = cy + (radius - strokeWidth / 2 - 4) * Math.sin(valueAngle)
            return (
              <circle
                cx={nx}
                cy={ny}
                r={strokeWidth * 0.35}
                fill="white"
                stroke={config.gradient[0]}
                strokeWidth={2}
                style={{ filter: `drop-shadow(0 0 4px ${config.glow})` }}
              />
            )
          })()}
        </svg>

        {/* Center Value */}
        {showValue && (
          <div
            className="absolute inset-x-0 bottom-0 flex flex-col items-center"
            style={{ paddingBottom: strokeWidth / 2 }}
          >
            <span
              className={cn(
                'text-3xl font-black num-display leading-none',
                config.text
              )}
            >
              {Math.round(percent)}
            </span>
            <span className="text-xs text-text-muted font-medium mt-0.5">
              از ۱۰۰
            </span>
          </div>
        )}
      </div>

      {label && (
        <p className="text-sm font-semibold text-text-primary text-center">{label}</p>
      )}
      {sublabel && (
        <p className="text-xs text-text-muted text-center">{sublabel}</p>
      )}
    </div>
  )
}