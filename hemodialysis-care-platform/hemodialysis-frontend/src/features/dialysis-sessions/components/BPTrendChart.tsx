// src/features/dialysis-sessions/components/BPTrendChart.tsx
'use client'

import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { Activity } from 'lucide-react'
import { formatPersianDate } from '@/lib/utils/date.utils'
import type { BPTrendPoint } from '../types/session.types'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-primary-100 rounded-xl shadow-azure p-3 text-sm font-vazir">
      <p className="text-text-muted mb-2">{formatPersianDate(label)}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-text-secondary">{p.name}:</span>
          <span className="font-semibold">{p.value} mmHg</span>
        </div>
      ))}
    </div>
  )
}

export function BPTrendChart({ data }: { data: BPTrendPoint[] }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white rounded-2xl border border-primary-100 shadow-azure p-5"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
          <Activity className="w-4 h-4 text-red-500" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">روند فشار خون</h3>
          <p className="text-xs text-text-muted">فشار قبل از دیالیز — سیستولیک</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0F2FE" />
            <XAxis
              dataKey="date"
              tickFormatter={formatPersianDate}
              tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Vazirmatn' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[60, 220]}
              tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Vazirmatn' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(val) =>
                val === 'pre_systolic' ? 'سیستولیک قبل' :
                val === 'pre_diastolic' ? 'دیاستولیک قبل' : val
              }
              wrapperStyle={{ fontFamily: 'Vazirmatn', fontSize: 12 }}
            />

            {/* خطوط مرجع */}
            <ReferenceLine y={160} stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={1} />
            <ReferenceLine y={90} stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1} />

            <Line
              type="monotone"
              dataKey="pre_systolic"
              name="pre_systolic"
              stroke="#0EA5E9"
              strokeWidth={2.5}
              dot={(props) => {
                const { cx, cy, payload } = props
                const isIDH = payload.had_idh
                return (
                  <circle
                    key={`dot-${payload.date}`}
                    cx={cx}
                    cy={cy}
                    r={isIDH ? 6 : 4}
                    fill={isIDH ? '#EF4444' : '#0EA5E9'}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )
              }}
              activeDot={{ r: 6, fill: '#0EA5E9', stroke: '#fff', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="pre_diastolic"
              name="pre_diastolic"
              stroke="#06B6D4"
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={{ fill: '#06B6D4', r: 3, stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* راهنما */}
      <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>نقطه قرمز = IDH</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-px bg-amber-400" style={{ borderTop: '2px dashed' }} />
          <span>خط زرد = ۱۶۰ mmHg</span>
        </div>
      </div>
    </motion.div>
  )
}