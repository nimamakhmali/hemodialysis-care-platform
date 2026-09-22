'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils/cn'

export interface Tab {
  key: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
  disabled?: boolean
}

interface TabsProps {
  tabs: Tab[]
  // پشتیبانی از هر دو نوع prop برای سازگاری
  activeTab?: string
  activeKey?: string
  onChange?: (key: string) => void
  variant?: 'line' | 'pill' | 'card'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
}

export function Tabs({
  tabs,
  activeTab,
  activeKey,
  onChange,
  variant = 'line',
  size = 'md',
  fullWidth,
  className,
}: TabsProps) {
  const initialKey = activeTab ?? activeKey ?? tabs[0]?.key
  const [internalActive, setInternalActive] = useState(initialKey)
  const current = activeTab ?? activeKey ?? internalActive

  const handleChange = (key: string) => {
    setInternalActive(key)
    onChange?.(key)
  }

  const sizeMap = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  }

  if (variant === 'pill') {
    return (
      <div
        className={cn(
          'flex items-center gap-1 p-1 bg-[#F0F9FF] rounded-2xl border border-[#BAE6FD]/60',
          fullWidth && 'w-full',
          className
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => !tab.disabled && handleChange(tab.key)}
            disabled={tab.disabled}
            className={cn(
              'relative flex items-center rounded-xl font-medium transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/30',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              sizeMap[size],
              fullWidth && 'flex-1 justify-center',
              current === tab.key
                ? 'text-[#0284C7]'
                : 'text-[#475569] hover:text-[#0F172A]'
            )}
          >
            {current === tab.key && (
              <motion.div
                layoutId="pill-bg"
                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-[#BAE6FD]/50"
                transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
                    current === tab.key
                      ? 'bg-[#0EA5E9]/20 text-[#0284C7]'
                      : 'bg-slate-200 text-slate-500'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    )
  }

  // Default: line
  return (
    <div
      className={cn(
        'relative flex items-center gap-0 border-b border-[#BAE6FD]/50',
        fullWidth && 'w-full',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => !tab.disabled && handleChange(tab.key)}
          disabled={tab.disabled}
          className={cn(
            'relative flex items-center font-medium -mb-px pb-px',
            'transition-all duration-200',
            'focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed',
            sizeMap[size],
            fullWidth && 'flex-1 justify-center',
            current === tab.key
              ? 'text-[#0284C7]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          )}
        >
          {tab.icon && <span className="shrink-0">{tab.icon}</span>}
          {tab.label}
          {tab.badge !== undefined && (
            <span
              className={cn(
                'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
                current === tab.key ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500'
              )}
            >
              {tab.badge}
            </span>
          )}
          {current === tab.key && (
            <motion.div
              layoutId="tab-line"
              className="absolute bottom-0 right-0 left-0 h-0.5 rounded-t-full bg-gradient-to-l from-[#0EA5E9] to-[#06B6D4]"
              transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            />
          )}
        </button>
      ))}
    </div>
  )
}