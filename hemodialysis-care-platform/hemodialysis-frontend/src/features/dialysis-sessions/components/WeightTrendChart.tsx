// src/features/dialysis-sessions/components/WeightTrendChart.tsx
'use client'

import { useRef, useEffect } from 'react'
import { motion, useInView } from 'motion/react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { Scale } from 'lucide-react'
import { formatPersianDate } from '@/lib/utils/date.utils'
import type { WeightTrendPoint } from '../types/session.types'

interface Props {
  data: WeightTrendPoint[]
  dryWeight?: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-primary-100 rounded-xl shadow-azure p-3 text-sm font-vazir">
      <p className="text-text-muted mb-2">{formatPersianDate(label)}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-text-secondary">{p.name}:</span>
          <span className="font-semibold text-text-primary">{p.value?.toFixed(1)} kg</span>
        </div>
      ))}
    </div>
  )
}

export function WeightTrendChart({ data, dryWeight }: Props) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white rounded-2xl border border-primary-100 shadow-azure p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
          <Scale className="w-4 h-4 text-primary-600" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">روند وزن</h3>
          <p className="text-xs text-text-muted">وزن قبل و بعد از دیالیز</p>
        </div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="preWeightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="postWeightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#E0F2FE" />
            <XAxis
              dataKey="date"
              tickFormatter={formatPersianDate}
              tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Vazirmatn' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Vazirmatn' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(val) =>
                val === 'pre_weight' ? 'وزن قبل' :
                val === 'post_weight' ? 'وزن بعد' : val
              }
              wrapperStyle={{ fontFamily: 'Vazirmatn', fontSize: 12 }}
            />

            {dryWeight && (
              <ReferenceLine
                y={dryWeight}
                stroke="#14B8A6"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{
                  value: `وزن خشک: ${dryWeight}`,
                  position: 'insideTopRight',
                  fontSize: 11,
                  fill: '#14B8A6',
                  fontFamily: 'Vazirmatn',
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="pre_weight"
              name="pre_weight"
              stroke="#0EA5E9"
              strokeWidth={2.5}
              fill="url(#preWeightGrad)"
              dot={{ fill: '#0EA5E9', r: 4, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#0EA5E9', stroke: '#fff', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="post_weight"
              name="post_weight"
              stroke="#06B6D4"
              strokeWidth={2}
              fill="url(#postWeightGrad)"
              strokeDasharray="4 2"
              dot={{ fill: '#06B6D4', r: 3, strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  )
}