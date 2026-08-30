import {
  LayoutDashboard,
  Users,
  Activity,
  FlaskConical,
  Bell,
  BookOpen,
  MessageSquare,
  Droplets,
  Utensils,
  FileText,
  Shield,
  Settings,
  Heart,
} from 'lucide-react'
import type { NavItem } from '@appTypes/common.types'

export const CLINICIAN_NAV: NavItem[] = [
  {
    label: 'داشبورد',
    href: '/clinician',
    icon: LayoutDashboard,
    description: 'نمای کلی سیستم',
  },
  {
    label: 'بیماران',
    href: '/clinician/patients',
    icon: Users,
    description: 'مدیریت پرونده بیماران',
  },
  {
    label: 'هشدارها',
    href: '/clinician/alerts',
    icon: Bell,
    description: 'هشدارهای بالینی فعال',
  },
  {
    label: 'توصیه‌ها',
    href: '/clinician/recommendations',
    icon: Activity,
    description: 'پیشنهادات در انتظار تأیید',
  },
]

export const PATIENT_NAV: NavItem[] = [
  {
    label: 'وضعیت من',
    href: '/patient',
    icon: Heart,
    description: 'داشبورد شخصی',
  },
  {
    label: 'علائم',
    href: '/patient/symptoms',
    icon: Activity,
    description: 'ثبت علائم و عوارض',
  },
  {
    label: 'مایعات',
    href: '/patient/fluid',
    icon: Droplets,
    description: 'پایش مصرف مایعات',
  },
  {
    label: 'رژیم غذایی',
    href: '/patient/diet',
    icon: Utensils,
    description: 'رعایت رژیم درمانی',
  },
  {
    label: 'پیام‌ها',
    href: '/patient/messages',
    icon: MessageSquare,
    description: 'پیام‌های تیم درمان',
  },
  {
    label: 'آموزش',
    href: '/patient/education',
    icon: BookOpen,
    description: 'مطالب آموزشی',
  },
]

export const ADMIN_NAV: NavItem[] = [
  {
    label: 'داشبورد',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'آمار و وضعیت سیستم',
  },
  {
    label: 'کاربران',
    href: '/admin/users',
    icon: Users,
    description: 'مدیریت کاربران',
  },
  {
    label: 'محتوای آموزشی',
    href: '/admin/education',
    icon: BookOpen,
    description: 'مدیریت محتوا',
  },
  {
    label: 'گزارش فعالیت',
    href: '/admin/audit-logs',
    icon: FileText,
    description: 'لاگ‌های سیستم',
  },
]