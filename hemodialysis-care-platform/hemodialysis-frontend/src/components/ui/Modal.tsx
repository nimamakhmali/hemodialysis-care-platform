'use client'

import { useEffect, useRef, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@lib/utils/cn'
import { Button } from './Button'

const sizeMap = {
  xs: 'max-w-sm',
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: keyof typeof sizeMap
  showClose?: boolean
  preventClose?: boolean
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  headerClassName?: string
  bodyClassName?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  showClose = true,
  preventClose = false,
  children,
  footer,
  className,
  headerClassName,
  bodyClassName,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Escape key
  useEffect(() => {
    if (!isOpen || preventClose) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose, preventClose])

  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <Fragment>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed inset-0 z-modal',
              'bg-text-primary/40 backdrop-blur-sm'
            )}
            ref={overlayRef}
            onClick={() => !preventClose && onClose()}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
              className={cn(
                'w-full pointer-events-auto',
                'bg-white rounded-2xl shadow-2xl',
                'border border-border-subtle',
                'flex flex-col max-h-[90vh]',
                'overflow-hidden',
                sizeMap[size],
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || showClose) && (
                <div
                  className={cn(
                    'flex items-start justify-between',
                    'px-6 py-5 border-b border-border-subtle',
                    'flex-shrink-0',
                    headerClassName
                  )}
                >
                  {title && (
                    <div>
                      <h2 className="text-lg font-bold text-text-primary leading-tight">
                        {title}
                      </h2>
                      {description && (
                        <p className="text-sm text-text-muted mt-1">
                          {description}
                        </p>
                      )}
                    </div>
                  )}
                  {showClose && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onClose}
                      className="flex-shrink-0 -mt-1 -ml-1"
                      aria-label="بستن"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* Body */}
              <div
                className={cn(
                  'flex-1 overflow-y-auto px-6 py-5 thin-scrollbar',
                  bodyClassName
                )}
              >
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div
                  className={cn(
                    'px-6 py-4 border-t border-border-subtle',
                    'flex-shrink-0 bg-surface/50'
                  )}
                >
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </Fragment>
      )}
    </AnimatePresence>,
    document.body
  )
}