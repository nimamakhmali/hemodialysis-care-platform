import { cn } from '@lib/utils/cn'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  badge?: React.ReactNode
  className?: string
  breadcrumb?: Array<{ label: string; href?: string }>
}

import { motion } from "motion/react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  badge,
  className,
  breadcrumb,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div className="flex items-start gap-4 min-w-0">
        {icon && (
          <div
            className={cn(
              'flex-shrink-0 w-11 h-11 rounded-2xl',
              'flex items-center justify-center',
              'bg-gradient-to-br from-primary-100 to-primary-200',
              'border border-primary-200 shadow-soft',
              'text-primary-600'
            )}
          >
            {icon}
          </div>
        )}

        <div className="min-w-0">
          {breadcrumb && breadcrumb.length > 0 && (
            <div className="flex items-center gap-1 mb-1">
              {breadcrumb.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && (
                    <span className="text-text-disabled text-xs">/</span>
                  )}
                  <span className="text-xs text-text-muted">
                    {crumb.label}
                  </span>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-text-primary">{title}</h1>
            {badge}
          </div>

          {subtitle && (
            <p className="text-sm text-text-muted mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  )
}