// src/features/dialysis-sessions/components/IDWGGauge.tsx
'use client'

import { useEffect, useRef } from 'react'
import { motion, useAnimationControls } from 'motion/react'
import { gsap } from 'gsap'

interface Props {
  percent: number
  kg: number
  dryWeight: number
}

export function IDWGGauge({ percent, kg, dryWeight }: Props) {
  const controls = useAnimationControls()
  const arcRef = useRef<SVGPathElement>(null)

  const radius = 70
  const stroke = 10
  const normalizedR = radius - stroke / 2
  const circumference = Math.PI * normalizedR // نیم‌دایره
  const maxPercent = 8
  const clampedPercent = Math.min(percent, maxPercent)
  const offset = circumference - (clampedPercent / maxPercent) * circumference

  const color =
    percent >= 5 ? '#EF4444' :
    percent >= 3 ? '#F59E0B' :
    '#22C55E'

  useEffect(() => {
    if (!arcRef.current) return
    gsap.fromTo(
      arcRef.current,
      { strokeDashoffset: circumference },
      {
        strokeDashoffset: offset,
        duration: 1.4,
        ease: 'power3.out',
        delay: 0.3,
      }
    )
  }, [percent])

  const statusLabel =
    percent >= 5 ? 'بحرانی' :
    percent >= 3 ? 'هشدار' :
    'مناسب'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center"
    >
      <div className="relative">
        <svg width={160} height={90} viewBox="0 0 160 90">
          {/* پس‌زمینه قوس */}
          <path
            d="M 15 80 A 65 65 0 0 1 145 80"
            fill="none"
            stroke="#E0F2FE"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* قوس مقدار */}
          <path
            ref={arcRef}
            d="M 15 80 A 65 65 0 0 1 145 80"
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>

        {/* مقادیر مرکزی */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="text-2xl font-bold"
            style={{ color }}
          >
            {percent.toFixed(1)}%
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="text-xs text-text-muted"
          >
            {kg.toFixed(1)} kg +
          </motion.span>
        </div>
      </div>

      {/* برچسب */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mt-2 text-center"
      >
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
          style={{
            background: `${color}15`,
            color,
          }}
        >
          {statusLabel}
        </span>
        <p className="text-xs text-text-muted mt-1">
          وزن خشک: {dryWeight} kg
        </p>
      </motion.div>
    </motion.div>
  )
}