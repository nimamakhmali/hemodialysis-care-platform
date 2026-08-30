'use client'

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'
import { cn } from '@lib/utils/cn'
import { CHART_COLORS } from '@config/constants'
import type { ChartLine, ChartReferenceLine } from './LineChart'

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
  dataKey: string
}

function AreaTooltip({
  active,
  payload,
  label,
  xFormatter,
  yFormatter,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: unknown
  xFormatter?: (v: unknown) => string
  yFormatter?: (v: unknown) => string
}) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="bg-white/95 backdrop-blur-md border border-border-subtle rounded-2xl shadow-lg px-4 py-3 min-w-[140px]"
      style={{ fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}
    >
      <p className="text-xs font-semibold text-text-muted mb-2 pb-2 border-b border-border-subtle">
        {xFormatter ? xFormatter(label) : String(label ?? '')}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: entry.color, opacity: 0.8 }}
              />
              <span className="text-xs text-text-secondary">{entry.name}</span>
            </div>
            <span className="text-xs font-bold text-text-primary num-display">
              {yFormatter ? yFormatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface AreaChartProps {
  data: Array<Record<string, unknown>>
  areas: ChartLine[]
  xKey: string
  xFormatter?: (value: unknown) => string
  yFormatter?: (value: unknown) => string
  referenceLines?: ChartReferenceLine[]
  height?: number
  showLegend?: boolean
  stacked?: boolean
  className?: string
  yDomain?: [number | 'auto', number | 'auto']
}

const DEFAULT_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.accent,
]

export function AreaChart({
  data,
  areas,
  xKey,
  xFormatter,
  yFormatter,
  referenceLines,
  height = 260,
  showLegend = false,
  stacked = false,
  className,
  yDomain,
}: AreaChartProps) {
  const visibleAreas = areas.filter((a) => !a.hidden)

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
          style={{ direction: 'ltr' }}
        >
          <defs>
            {visibleAreas.map((area, i) => {
              const color = area.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
              const id = `area-grad-${area.dataKey}`
              return (
                <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="60%" stopColor={color} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              )
            })}
          </defs>

          <CartesianGrid
            strokeDasharray="4 4"
            stroke="#E0F2FE"
            vertical={false}
            strokeOpacity={0.8}
          />

          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Vazirmatn, sans-serif' }}
            axisLine={{ stroke: '#E0F2FE' }}
            tickLine={false}
            tickMargin={8}
            tickFormatter={xFormatter as ((v: unknown) => string) | undefined}
          />

          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Vazirmatn, sans-serif' }}
            axisLine={false}
            tickLine={false}
            tickMargin={4}
            tickFormatter={yFormatter as ((v: unknown) => string) | undefined}
            domain={yDomain}
            width={40}
          />

          <Tooltip
            content={
              <AreaTooltip
                xFormatter={xFormatter}
                yFormatter={yFormatter}
              />
            }
            cursor={{ stroke: '#0EA5E9', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.5 }}
          />

          {showLegend && (
            <Legend
              wrapperStyle={{
                fontFamily: 'Vazirmatn, sans-serif',
                fontSize: 12,
                paddingTop: 12,
                direction: 'rtl',
              }}
            />
          )}

          {referenceLines?.map((ref, i) => (
            <ReferenceLine
              key={i}
              y={ref.y}
              stroke={ref.color ?? '#94A3B8'}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              strokeOpacity={0.7}
              label={{
                value: ref.label,
                fill: ref.color ?? '#64748B',
                fontSize: 10,
                fontFamily: 'Vazirmatn, sans-serif',
                position: 'right',
              }}
            />
          ))}

          {visibleAreas.map((area, i) => {
            const color = area.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
            return (
              <Area
                key={area.dataKey}
                type="monotone"
                dataKey={area.dataKey}
                name={area.label}
                stroke={color}
                strokeWidth={area.width ?? 2.5}
                fill={`url(#area-grad-${area.dataKey})`}
                stackId={stacked ? 'stack' : undefined}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: '#fff',
                  stroke: color,
                  strokeWidth: 2.5,
                }}
              />
            )
          })}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
}