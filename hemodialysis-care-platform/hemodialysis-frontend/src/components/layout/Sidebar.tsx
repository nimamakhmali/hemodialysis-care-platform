'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Heart, LogOut, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { USER_ROLE_FA } from '@/config/constants'
import type { NavItem } from '@/types/common.types'

interface SidebarProps {
  navItems: NavItem[]
}

export function Sidebar({ navItems }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <aside
      className={cn(
        'w-64 h-screen flex flex-col fixed right-0 top-0',
        'z-30 select-none',
        'border-l border-[#BAE6FD]/60',
        'overflow-hidden'
      )}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#F0F9FF] to-[#ECFEFF]" />
      <div
        className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at top right, rgba(14,165,233,0.10), transparent 60%)',
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col h-full z-10">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] shadow-lg shadow-primary-500/20 shrink-0">
              <Heart className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-[#0F172A] leading-tight">
                سامانه دیالیز
              </h1>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                پایش هوشمند بیماران
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 mb-4 h-px bg-[#BAE6FD]/50" />

        {/* Nav label */}
        <p className="px-5 mb-2 text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">
          منوی اصلی
        </p>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href ||
                pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative group flex items-center gap-3',
                  'px-3 py-2.5 rounded-xl',
                  'text-sm font-medium',
                  'transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/30',
                  isActive
                    ? 'text-[#0284C7] bg-[#E0F2FE]'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F0F9FF]'
                )}
              >
                {/* Active indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full bg-gradient-to-b from-[#0EA5E9] to-[#0284C7]"
                      transition={{
                        type: 'spring',
                        duration: 0.4,
                        bounce: 0.2,
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon */}
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-[#BAE6FD]/60 text-[#0284C7]'
                      : 'text-[#94A3B8] group-hover:text-[#0EA5E9] group-hover:bg-[#E0F2FE]'
                  )}
                >
                  <Icon size={16} />
                </div>

                {/* Label */}
                <span className="flex-1 leading-none">{item.label}</span>

                {/* Badge */}
                {item.badge !== undefined && Number(item.badge) > 0 && (
                  <span
                    className={cn(
                      'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5',
                      'text-[10px] font-bold shrink-0',
                      item.badgeVariant === 'danger'
                        ? 'bg-red-500 text-white'
                        : item.badgeVariant === 'warning'
                        ? 'bg-amber-400 text-white'
                        : 'bg-[#0EA5E9] text-white'
                    )}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Arrow */}
                {!isActive && (
                  <ChevronLeft className="h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:opacity-50 group-hover:-translate-x-0.5" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom divider */}
        <div className="mx-4 mb-4 h-px bg-[#BAE6FD]/50" />

        {/* User */}
        <div className="px-3 pb-5">
          <div className="flex items-center gap-3 rounded-2xl border border-[#BAE6FD]/60 bg-white/80 p-3 shadow-sm">
            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-sm font-bold text-white">
              {user?.full_name?.charAt(0) ?? '?'}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#0F172A] truncate leading-tight">
                {user?.full_name ?? 'کاربر'}
              </p>
              <p className="text-[11px] text-[#64748B]">
                {user?.role ? USER_ROLE_FA[user.role] : ''}
              </p>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="خروج"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#94A3B8] transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-50 disabled:cursor-wait focus:outline-none"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}