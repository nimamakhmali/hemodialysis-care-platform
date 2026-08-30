'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bell, Search, Menu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@lib/utils/cn'
import { useAuthStore } from '@features/auth/stores/auth.store'
import { Avatar } from '@components/ui/Avatar'
import { Badge } from '@components/ui/Badge'

interface HeaderProps {
  onMenuToggle?: () => void
  alertCount?: number
}

const PAGE_TITLES: Record<string, string> = {
  '/clinician': 'داشبورد',
  '/clinician/patients': 'مدیریت بیماران',
  '/clinician/alerts': 'هشدارهای بالینی',
  '/clinician/recommendations': 'توصیه‌های پزشکی',
  '/patient': 'وضعیت من',
  '/patient/symptoms': 'ثبت علائم',
  '/patient/fluid': 'پایش مایعات',
  '/patient/diet': 'رژیم غذایی',
  '/patient/messages': 'پیام‌ها',
  '/patient/education': 'آموزش',
  '/admin': 'داشبورد مدیریت',
  '/admin/users': 'مدیریت کاربران',
  '/admin/education': 'محتوای آموزشی',
  '/admin/audit-logs': 'گزارش فعالیت',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const base = Object.keys(PAGE_TITLES)
    .filter((k) => pathname.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0]
  return base ? PAGE_TITLES[base] : 'سامانه دیالیز'
}

export function Header({ onMenuToggle, alertCount = 0 }: HeaderProps) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const [showSearch, setShowSearch] = useState(false)

  const title = getPageTitle(pathname)

  return (
    <header
      className={cn(
        'sticky top-0 z-header',
        'h-header flex items-center',
        'px-6 gap-4',
        'border-b border-border-subtle',
        'overflow-hidden'
      )}
    >
      {/* ── Background ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
      <div className="absolute inset-0 bg-glow-top-right opacity-40" />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(186,230,253,0.8), transparent)',
        }}
      />

      {/* ── Content ────────────────────────────────────────────────── */}
      <div className="relative flex items-center gap-4 w-full">

        {/* Mobile Menu */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className={cn(
              'lg:hidden flex-shrink-0',
              'w-9 h-9 rounded-xl flex items-center justify-center',
              'text-text-muted hover:text-primary-600 hover:bg-surface',
              'transition-all duration-200'
            )}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Page Title */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-base font-bold text-text-primary truncate">
                {title}
              </h2>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">

          {/* Search */}
          <AnimatePresence>
            {showSearch ? (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 200 }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <input
                  autoFocus
                  type="text"
                  placeholder="جستجو..."
                  onBlur={() => setShowSearch(false)}
                  className={cn(
                    'w-full h-9 px-3 rounded-xl',
                    'text-sm bg-surface border border-border',
                    'focus:outline-none focus:ring-2 focus:ring-primary-400/30',
                    'focus:border-primary-400 focus:bg-white',
                    'transition-all duration-200',
                    'placeholder:text-text-disabled'
                  )}
                />
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowSearch(true)}
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center',
                  'text-text-muted hover:text-primary-600 hover:bg-surface',
                  'transition-all duration-200 border border-transparent',
                  'hover:border-border-subtle'
                )}
              >
                <Search className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Notifications */}
          <div className="relative">
            <button
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center',
                'text-text-muted hover:text-primary-600 hover:bg-surface',
                'transition-all duration-200 border border-transparent',
                'hover:border-border-subtle',
                alertCount > 0 && 'text-primary-600'
              )}
            >
              <Bell className="h-4 w-4" />
            </button>

            {/* Badge */}
            {alertCount > 0 && (
              <span
                className={cn(
                  'absolute -top-1 -left-1',
                  'min-w-[18px] h-[18px] px-1',
                  'flex items-center justify-center',
                  'rounded-full text-[10px] font-bold text-white',
                  'bg-danger shadow-danger',
                  'animate-bounce-subtle'
                )}
              >
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-border mx-1" />

          {/* User Avatar */}
          <div className="flex items-center gap-2.5">
            <Avatar
              name={user?.full_name}
              size="sm"
              variant="azure"
            />
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-text-primary leading-tight max-w-[120px] truncate">
                {user?.full_name}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}