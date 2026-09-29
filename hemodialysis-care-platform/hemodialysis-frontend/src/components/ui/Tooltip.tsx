// src/components/ui/Tooltip.tsx
'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils/cn'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  return (
    <div className="group relative inline-flex">
      {children}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileHover={{ opacity: 1, scale: 1 }}
        className={cn(
          'absolute z-50 pointer-events-none px-2.5 py-1.5 text-xs font-medium text-white bg-slate-800 rounded-lg shadow-lg whitespace-nowrap',
          side === 'top' && 'bottom-full left-1/2 -translate-x-1/2 -mb-2',
          side === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-2',
          side === 'left' && 'right-full top-1/2 -translate-y-1/2 -mr-2',
          side === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-2',
          className
        )}
      >
        {content}
      </motion.div>
    </div>
  )
}