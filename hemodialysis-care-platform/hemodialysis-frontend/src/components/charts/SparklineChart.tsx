'use client'

import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { cn } from '@lib/utils/cn'
import type { HealthStatus } from '@appTypes/common.types'

const statusColorMap: Record<HealthStatus, string> = {
  ok: '#22C55E',
  warning: '#F59E0B',
  critical: '#EF4444',
  neutral: '#0EA5E9',
  unknown: '#94A3B8',
}

interface SparklineChartProps {
  data: Array<{ value: number | null; [key: string]: unknown }>
  dataKey?: string
  color?: string
  status?: HealthStatus
  height?: number
  width?: number | string
  showTooltip?: boolean
  refValue?: number
  className?: string
  strokeWidth?: number
}

export function SparklineChart({
  data,
  dataKey = 'value',
  color,
  status = 'neutral',
  height = 48,
  width = '100%',
  showTooltip = false,
  refValue,
  className,
  strokeWidth = 2,
}: SparklineChartProps) {
  const strokeColor = color ?? statusColorMap[status]

  return (
    <div className={cn('w-full', className)} style={{ height, width }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={`spark-grad-${dataKey}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.4} />
              <stop offset="50%" stopColor={strokeColor} stopOpacity={1} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.7} />
            </linearGradient>
          </defs>

          {showTooltip && (
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                return (
                  <div
                    className="bg-white border border-border-subtle rounded-xl shadow-md px-2.5 py-1.5 text-xs font-bold num-display"
                    style={{ color: strokeColor }}
                  >
                    {payload[0]?.value}
                  </div>
                )
              }}
            />
          )}

          {refValue !== undefined && (
            <ReferenceLine
              y={refValue}
              stroke={strokeColor}
              strokeDasharray="3 3"
              strokeOpacity={0.4}
              strokeWidth={1}
            />
          )}

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={`url(#spark-grad-${dataKey})`}
            strokeWidth={strokeWidth}
            dot={false}
            activeDot={
              showTooltip
                ? { r: 3, fill: '#fff', stroke: strokeColor, strokeWidth: 2 }
                : false
            }
            isAnimationActive={true}
            animationDuration={800}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}