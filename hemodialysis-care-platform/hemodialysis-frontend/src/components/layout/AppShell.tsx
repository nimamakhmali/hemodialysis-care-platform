'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils/cn'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import type { NavItem } from '@/types/common.types'

interface AppShellProps {
  children: React.ReactNode
  navItems: NavItem[]
  alertCount?: number
}

export function AppShell({ children, navItems, alertCount }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-[#F0F9FF]" dir="rtl">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar navItems={navItems} />
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 right-0 z-50 lg:hidden"
            >
              <Sidebar navItems={navItems} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:mr-64">
        <Header
          onMenuToggle={() => setMobileMenuOpen((p) => !p)}
          alertCount={alertCount}
        />
        <main className="flex-1 p-4 sm:p-6 max-w-screen-xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}