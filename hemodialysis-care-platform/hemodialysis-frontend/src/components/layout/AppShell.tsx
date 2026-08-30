'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@lib/utils/cn'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import type { NavItem } from '@appTypes/common.types'

interface AppShellProps {
  children: React.ReactNode
  navItems: NavItem[]
  alertCount?: number
}

export function AppShell({ children, navItems, alertCount }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex">
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <Sidebar navItems={navItems} />
      </div>

      {/* ── Mobile Sidebar Overlay ───────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-text-primary/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 right-0 z-50 lg:hidden"
            >
              <Sidebar navItems={navItems} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex-1 flex flex-col min-h-screen',
          'lg:mr-sidebar'
        )}
      >
        <Header
          onMenuToggle={() => setMobileMenuOpen(true)}
          alertCount={alertCount}
        />

        <main
          className={cn(
            'flex-1 p-6',
            'animate-fade-in-up',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}