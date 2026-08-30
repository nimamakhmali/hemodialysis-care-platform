// src/features/lab-results/components/LabTrendChart.tsx
'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'motion/react'
import { gsap } from 'gsap'
import { useEffect } from 'react'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, FlaskConical } from 'lucide-react'
import { LAB_NAMES_FA, LAB_UNITS, CHART_COLORS, TREND_DIRECTION_FA } from '@/config/constants'
import type { LabTrendResponse } from '../types/lab.types'
import type { LabTestCode } from '@/types/common.types'
import { cn } from '@/lib/utils/cn'

interface Props {
  data: LabTrendResponse
  testCode: string
}

const TREND_CONFIG = {
  increasing: { icon: TrendingUp,   color: '#F59E0B', label: 'صعودی'  },
  decreasing: { icon: TrendingDown, color: '#0EA5E9', label: 'نزولی'  },
  stable:     { icon: Minus,        color: '#22C55E', label: 'پایدار' },
}

function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null
  const pt = payload[0]?.payload
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-primary-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="text-slate-500 text-xs mb-1.5">{label}</p>
      <p className="font-bold text-slate-800 text-base">
        {payload[0]?.value} <span className="text-xs font-normal text-slate-500">{unit}</span>
      </p>
      {pt?.is_abnormal && (
        <p className="text-xs text-amber-600 mt-1">● خارج از محدوده طبیعی</p>
      )}
    </div>
  )
}

export function LabTrendChart({ data, testCode }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const trend = data.trend
  const history = data.history ?? []
  const nameFa = LAB_NAMES_FA[testCode as LabTestCode] ?? testCode
  const unit = (data.unit || LAB_UNITS[testCode as LabTestCode]) ?? ''

  const trendCfg = TREND_CONFIG[trend.direction] ?? TREND_CONFIG.stable
  const TrendIcon = trendCfg.icon

  // رنگ بر اساس trend و وضعیت
  const lineColor = trend.isConcerning ? '#EF4444' : CHART_COLORS.primary

  // اضافه کردن عنوان فارسی به data
  const chartData = history.map((pt) => ({
    ...pt,
    value: pt.value,
  }))

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white rounded-2xl border border-primary-100 overflow-hidden"
      style={{ boxShadow: '0 4px 24px rgba(14,165,233,0.07)' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-slate-50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-primary-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{nameFa}</h3>
              <p className="text-xs text-slate-400">{testCode} — {unit}</p>
            </div>
          </div>

          {/* Trend badge */}
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
              style={{
                background: `${trendCfg.color}12`,
                borderColor: `${trendCfg.color}30`,
                color: trendCfg.color,
              }}
            >
              <TrendIcon className="w-3.5 h-3.5" />
              {TREND_DIRECTION_FA[trend.direction]}
              {trend.changePercent !== 0 && (
                <span className="opacity-70">({Math.abs(trend.changePercent).toFixed(1)}%)</span>
              )}
            </motion.div>

            {trend.isConcerning && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="px-2 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs"
              >
                نگران‌کننده
              </motion.span>
            )}
          </div>
        </div>

        {/* Interpretation */}
        {trend.interpretationFa && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
            className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg px-3 py-2"
          >
            {trend.interpretationFa}
          </motion.p>
        )}
      </div>

      {/* Chart */}
      {!chartData.length ? (
        <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
          داده‌ای برای نمایش وجود ندارد
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="px-2 pb-4 pt-4"
        >
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id={`labGrad_${testCode}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={lineColor} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Vazirmatn' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Vazirmatn' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip unit={unit} />} />

              <Area
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2.5}
                fill={`url(#labGrad_${testCode})`}
                dot={(props: any) => {
                  const { cx, cy, payload } = props
                  const dotColor = payload.is_abnormal ? '#F59E0B' : lineColor
                  return (
                    <circle
                      key={`dot-${payload.date}`}
                      cx={cx} cy={cy} r={4}
                      fill={dotColor}
                      stroke="#fff"
                      strokeWidth={2}
                      style={{ filter: payload.is_abnormal ? `drop-shadow(0 0 4px ${dotColor}80)` : 'none' }}
                    />
                  )
                }}
                activeDot={{ r: 6, fill: lineColor, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Stats row */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
          className="px-5 pb-4 grid grid-cols-3 gap-3"
        >
          {[
            { label: 'آخرین مقدار', value: `${chartData[chartData.length - 1]?.value} ${unit}` },
            { label: 'بیشینه',      value: `${Math.max(...chartData.map((d) => d.value))} ${unit}` },
            { label: 'کمینه',       value: `${Math.min(...chartData.map((d) => d.value))} ${unit}` },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-50 rounded-xl p-2.5 text-center">
              <p className="text-xs text-slate-400 mb-0.5">{stat.label}</p>
              <p className="text-sm font-bold text-slate-700">{stat.value}</p>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}