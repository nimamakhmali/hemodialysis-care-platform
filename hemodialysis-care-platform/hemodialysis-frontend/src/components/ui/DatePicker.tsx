// src/components/ui/DatePicker.tsx
'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface DatePickerProps {
  value?: string
  onChange: (value: string) => void
  className?: string
}

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  return (
    <div className={cn('relative', className)}>
      <input
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
      />
      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
    </div>
  )
}