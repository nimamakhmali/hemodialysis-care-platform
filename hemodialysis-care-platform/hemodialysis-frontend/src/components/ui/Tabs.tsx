'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@lib/utils/cn'

export interface Tab {
  key: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
  disabled?: boolean
}

interface TabsProps {
  tabs: Tab[]
  activeKey?: string
  onChange?: (key: string) => void
  variant?: 'line' | 'pill' | 'card'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
}

export function Tabs({
  tabs,
  activeKey,
  onChange,
  variant = 'line',
  size = 'md',
  fullWidth,
  className,
}: TabsProps) {
  const [active, setActive] = useState(activeKey ?? tabs[0]?.key)

  const current = activeKey ?? active

  const handleChange = (key: string) => {
    setActive(key)
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
          'flex items-center gap-1 p-1',
          'bg-surface rounded-2xl border border-border-subtle',
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
              'relative flex items-center rounded-xl font-medium',
              'transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/30',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              sizeMap[size],
              fullWidth && 'flex-1 justify-center',
              current === tab.key
                ? 'text-primary-700'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            {current === tab.key && (
              <motion.div
                layoutId="pill-bg"
                className="absolute inset-0 bg-white rounded-xl shadow-soft border border-border-subtle"
                transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center',
                    'min-w-[18px] h-[18px] px-1 rounded-full',
                    'text-[10px] font-bold',
                    current === tab.key
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-border text-text-muted'
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

  if (variant === 'card') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => !tab.disabled && handleChange(tab.key)}
            disabled={tab.disabled}
            className={cn(
              'flex items-center rounded-xl font-medium',
              'border transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/30',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              sizeMap[size],
              fullWidth && 'flex-1 justify-center',
              current === tab.key
                ? 'bg-white border-border-subtle shadow-soft text-primary-700'
                : 'bg-transparent border-transparent text-text-muted hover:bg-surface'
            )}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && (
              <span className="bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }

  // Default: line
  return (
    <div
      className={cn(
        'relative flex items-center gap-0',
        'border-b border-border-subtle',
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
            'relative flex items-center font-medium',
            'transition-all duration-200',
            '-mb-px pb-px',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/30 focus-visible:ring-inset',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            sizeMap[size],
            fullWidth && 'flex-1 justify-center',
            current === tab.key
              ? 'text-primary-600'
              : 'text-text-muted hover:text-text-secondary'
          )}
        >
          {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
          {tab.label}
          {tab.badge !== undefined && (
            <span
              className={cn(
                'inline-flex items-center justify-center',
                'min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
                current === tab.key
                  ? 'bg-danger text-white'
                  : 'bg-border text-text-muted'
              )}
            >
              {tab.badge}
            </span>
          )}

          {/* Active Line */}
          {current === tab.key && (
            <motion.div
              layoutId="tab-line"
              className={cn(
                'absolute bottom-0 right-0 left-0 h-0.5',
                'bg-gradient-to-l from-primary-500 to-cyan-500',
                'rounded-t-full'
              )}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            />
          )}
        </button>
      ))}
    </div>
  )
}