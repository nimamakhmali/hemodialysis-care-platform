'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Dot,
} from 'recharts'
import { cn } from '@lib/utils/cn'
import { CHART_COLORS } from '@config/constants'

export interface ChartLine {
  dataKey: string
  label: string
  color?: string
  dashed?: boolean
  width?: number
  dot?: boolean
  hidden?: boolean
}

export interface ChartReferenceLine {
  y: number
  label: string
  color?: string
  dashed?: boolean
}

interface LineChartProps {
  data: Array<Record<string, unknown>>
  lines: ChartLine[]
  xKey: string
  xFormatter?: (value: unknown) => string
  yFormatter?: (value: unknown) => string
  referenceLines?: ChartReferenceLine[]
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  className?: string
  yDomain?: [number | 'auto', number | 'auto']
  connectNulls?: boolean
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
  dataKey: string
}

function CustomTooltip({
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
      className={cn(
        'bg-white/95 backdrop-blur-md',
        'border border-border-subtle rounded-2xl',
        'shadow-lg px-4 py-3 min-w-[140px]',
        'font-sans'
      )}
      style={{ fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}
    >
      <p className="text-xs font-semibold text-text-muted mb-2 pb-2 border-b border-border-subtle">
        {xFormatter ? xFormatter(label) : String(label)}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white"
                style={{ backgroundColor: entry.color }}
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

const DEFAULT_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.accent,
  CHART_COLORS.warning,
  CHART_COLORS.success,
]

function CustomDot(props: {
  cx?: number
  cy?: number
  fill?: string
  stroke?: string
  r?: number
}) {
  const { cx = 0, cy = 0, fill, stroke } = props
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#fff"
      stroke={stroke || fill}
      strokeWidth={2.5}
      style={{ filter: `drop-shadow(0 0 4px ${stroke || fill}40)` }}
    />
  )
}

function CustomActiveDot(props: {
  cx?: number
  cy?: number
  fill?: string
  stroke?: string
}) {
  const { cx = 0, cy = 0, fill, stroke } = props
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill={stroke || fill}
        fillOpacity={0.15}
      />
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="#fff"
        stroke={stroke || fill}
        strokeWidth={2.5}
      />
    </g>
  )
}

export function LineChart({
  data,
  lines,
  xKey,
  xFormatter,
  yFormatter,
  referenceLines,
  height = 260,
  showLegend = false,
  showGrid = true,
  className,
  yDomain,
  connectNulls = true,
}: LineChartProps) {
  const visibleLines = lines.filter((l) => !l.hidden)

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
          style={{ direction: 'ltr' }}
        >
          <defs>
            {visibleLines.map((line, i) => {
              const color = line.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
              return (
                <filter key={i} id={`glow-${line.dataKey}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              )
            })}
          </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#E0F2FE"
              vertical={false}
              strokeOpacity={0.8}
            />
          )}

          <XAxis
            dataKey={xKey}
            tick={{
              fontSize: 11,
              fill: '#94A3B8',
              fontFamily: 'Vazirmatn, sans-serif',
            }}
            axisLine={{ stroke: '#E0F2FE', strokeWidth: 1 }}
            tickLine={false}
            tickMargin={8}
            tickFormatter={xFormatter as ((v: unknown) => string) | undefined}
          />

          <YAxis
            tick={{
              fontSize: 11,
              fill: '#94A3B8',
              fontFamily: 'Vazirmatn, sans-serif',
            }}
            axisLine={false}
            tickLine={false}
            tickMargin={4}
            tickFormatter={yFormatter as ((v: unknown) => string) | undefined}
            domain={yDomain}
            width={40}
          />

          <Tooltip
            content={
              <CustomTooltip
                xFormatter={xFormatter}
                yFormatter={yFormatter}
              />
            }
            cursor={{
              stroke: '#0EA5E9',
              strokeWidth: 1,
              strokeDasharray: '4 4',
              strokeOpacity: 0.5,
            }}
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
              strokeDasharray={ref.dashed !== false ? '6 4' : undefined}
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

          {visibleLines.map((line, i) => {
            const color = line.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
            return (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.label}
                stroke={color}
                strokeWidth={line.width ?? 2.5}
                strokeDasharray={line.dashed ? '6 4' : undefined}
                dot={
                  line.dot !== false
                    ? <CustomDot stroke={color} />
                    : false
                }
                activeDot={<CustomActiveDot stroke={color} />}
                connectNulls={connectNulls}
                filter={`url(#glow-${line.dataKey})`}
              />
            )
          })}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}