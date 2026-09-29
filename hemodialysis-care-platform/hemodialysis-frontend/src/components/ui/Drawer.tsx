// src/components/ui/Drawer.tsx
'use client'

import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface DrawerProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  side?: 'left' | 'right'
  className?: string
}

export function Drawer({ open, onClose, children, side = 'right', className }: DrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: side === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'right' ? '100%' : '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed top-0 bottom-0 z-50 w-[80vw] max-w-sm bg-white shadow-2xl',
              side === 'right' ? 'right-0' : 'left-0',
              className
            )}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-lg hover:bg-slate-100"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}