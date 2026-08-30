'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'
import { cn } from '@lib/utils/cn'
import { CHART_COLORS } from '@config/constants'

interface TooltipPayloadItem {
  name: string
  value: number
  color?: string
}

function BarTooltip({
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
      className="bg-white/95 backdrop-blur-md border border-border-subtle rounded-2xl shadow-lg px-4 py-3"
      style={{ fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}
    >
      <p className="text-xs font-semibold text-text-primary mb-1">
        {xFormatter ? xFormatter(label) : String(label ?? '')}
      </p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs text-text-secondary">
          <span className="font-bold text-text-primary num-display">
            {yFormatter ? yFormatter(entry.value) : entry.value}
          </span>
          {entry.name && ` ${entry.name}`}
        </p>
      ))}
    </div>
  )
}

interface BarChartProps {
  data: Array<Record<string, unknown>>
  bars: Array<{
    dataKey: string
    label: string
    color?: string
    radius?: number
  }>
  xKey: string
  xFormatter?: (value: unknown) => string
  yFormatter?: (value: unknown) => string
  height?: number
  layout?: 'horizontal' | 'vertical'
  colorByValue?: boolean
  showLegend?: boolean
  className?: string
  maxBarSize?: number
}

const STATUS_COLORS = {
  high: CHART_COLORS.danger,
  medium: CHART_COLORS.warning,
  low: CHART_COLORS.primary,
}

export function BarChart({
  data,
  bars,
  xKey,
  xFormatter,
  yFormatter,
  height = 240,
  layout = 'horizontal',
  colorByValue,
  showLegend,
  className,
  maxBarSize = 48,
}: BarChartProps) {
  const isVertical = layout === 'vertical'

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{ top: 8, right: 8, left: isVertical ? 48 : -16, bottom: 4 }}
          style={{ direction: 'ltr' }}
          barCategoryGap="30%"
        >
          <defs>
            {bars.map((bar, i) => {
              const color = bar.color ?? CHART_COLORS.primary
              return (
                <linearGradient
                  key={i}
                  id={`bar-grad-${bar.dataKey}`}
                  x1="0"
                  y1="0"
                  x2={isVertical ? '1' : '0'}
                  y2={isVertical ? '0' : '1'}
                >
                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                </linearGradient>
              )
            })}
          </defs>

          <CartesianGrid
            strokeDasharray="4 4"
            stroke="#E0F2FE"
            vertical={!isVertical}
            horizontal={isVertical}
            strokeOpacity={0.8}
          />

          {isVertical ? (
            <>
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Vazirmatn, sans-serif' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={yFormatter as ((v: unknown) => string) | undefined}
              />
              <YAxis
                dataKey={xKey}
                type="category"
                tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Vazirmatn, sans-serif' }}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                width={60}
                tickFormatter={xFormatter as ((v: unknown) => string) | undefined}
              />
            </>
          ) : (
            <>
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
                width={40}
              />
            </>
          )}

          <Tooltip
            content={<BarTooltip xFormatter={xFormatter} yFormatter={yFormatter} />}
            cursor={{ fill: '#F0F9FF', rx: 8 }}
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

          {bars.map((bar, i) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.label}
              fill={`url(#bar-grad-${bar.dataKey})`}
              radius={bar.radius ?? [6, 6, 0, 0]}
              maxBarSize={maxBarSize}
            >
              {colorByValue &&
                data.map((entry, index) => {
                  const val = Number(entry[bar.dataKey])
                  const color =
                    val > 5 ? STATUS_COLORS.high
                    : val > 2 ? STATUS_COLORS.medium
                    : STATUS_COLORS.low
                  return (
                    <Cell
                      key={index}
                      fill={color}
                      fillOpacity={0.85}
                    />
                  )
                })}
            </Bar>
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}