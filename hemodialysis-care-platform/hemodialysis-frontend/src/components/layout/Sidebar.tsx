'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  LogOut,
  ChevronLeft,
  Settings,
} from 'lucide-react'
import { cn } from '@lib/utils/cn'
import { useAuthStore } from '@features/auth/stores/auth.store'
import { Avatar } from '@components/ui/Avatar'
import { Badge } from '@components/ui/Badge'
import { USER_ROLE_FA } from '@config/constants'
import type { NavItem } from '@appTypes/common.types'

interface SidebarProps {
  navItems: NavItem[]
}

export function Sidebar({ navItems }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logout()
  }

  return (
    <aside
      className={cn(
        'w-sidebar h-screen flex flex-col fixed right-0 top-0',
        'z-sidebar select-none',
        'border-l border-border-subtle',
        'overflow-hidden'
      )}
    >
      {/* ── Background Layers ─────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-surface-50 to-primary-50/40" />
      <div className="absolute inset-0 bg-dot-pattern opacity-30" />
      <div className="absolute top-0 left-0 right-0 h-64 bg-glow-top-right opacity-50" />

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="relative flex flex-col h-full z-10">

        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'relative w-11 h-11 rounded-2xl flex-shrink-0',
                'flex items-center justify-center',
                'bg-gradient-azure shadow-glow-sm',
                'overflow-hidden'
              )}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <Heart className="h-5 w-5 text-white relative z-10" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-text-primary leading-tight">
                سامانه دیالیز
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                پایش هوشمند بیماران
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 mb-4">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Nav Label */}
        <p className="px-5 mb-2 text-[10px] font-bold text-text-disabled uppercase tracking-widest">
          منوی اصلی
        </p>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto no-scrollbar pb-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')
            const isExact = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative group flex items-center gap-3',
                  'px-3 py-2.5 rounded-xl',
                  'text-sm font-medium',
                  'transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40',
                  isActive
                    ? 'text-primary-700 bg-primary-100/80'
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-surface'
                )}
              >
                {/* Active Indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className={cn(
                        'absolute right-0 top-1/2 -translate-y-1/2',
                        'w-1 h-6 rounded-l-full',
                        'bg-gradient-to-b from-primary-400 to-primary-600',
                        'shadow-glow-sm'
                      )}
                      transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon */}
                <div
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-lg',
                    'flex items-center justify-center',
                    'transition-all duration-200',
                    isActive
                      ? 'bg-primary-200/60 text-primary-600'
                      : 'text-text-muted group-hover:text-primary-500 group-hover:bg-primary-50'
                  )}
                >
                  <Icon size={16} />
                </div>

                {/* Label */}
                <span className="flex-1 leading-none">{item.label}</span>

                {/* Badge */}
                {item.badge !== undefined && (
                  <Badge
                    variant={item.badgeVariant === 'danger' ? 'danger' : 'default'}
                    size="xs"
                    rounded="full"
                    className="flex-shrink-0"
                  >
                    {item.badge}
                  </Badge>
                )}

                {/* Hover Arrow */}
                <ChevronLeft
                  className={cn(
                    'h-3.5 w-3.5 flex-shrink-0 opacity-0',
                    'transition-all duration-200',
                    'group-hover:opacity-60 group-hover:-translate-x-0.5'
                  )}
                />
              </Link>
            )
          })}
        </nav>

        {/* Bottom Divider */}
        <div className="mx-4 mb-4">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* User Profile */}
        <div className="px-3 pb-5">
          <div
            className={cn(
              'relative overflow-hidden',
              'flex items-center gap-3 p-3 rounded-2xl',
              'bg-white border border-border-subtle shadow-soft',
              'group'
            )}
          >
            {/* Subtle hover glow */}
            <div className="absolute inset-0 bg-gradient-card-hover opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <Avatar
              name={user?.full_name}
              size="sm"
              variant="azure"
              className="relative z-10 flex-shrink-0"
            />

            <div className="flex-1 min-w-0 relative z-10">
              <p className="text-sm font-semibold text-text-primary truncate leading-tight">
                {user?.full_name}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {user?.role ? USER_ROLE_FA[user.role] : ''}
              </p>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={cn(
                'relative z-10 flex-shrink-0',
                'w-7 h-7 rounded-lg flex items-center justify-center',
                'text-text-muted transition-all duration-200',
                'hover:bg-danger-light hover:text-danger',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/30',
                'disabled:opacity-50 disabled:cursor-wait'
              )}
              title="خروج از سیستم"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}