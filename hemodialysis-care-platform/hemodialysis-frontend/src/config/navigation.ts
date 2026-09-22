import {
  LayoutDashboard,
  Users,
  Bell,
  BookOpen,
  Activity,
  Droplets,
  Utensils,
  MessageSquare,
  ClipboardList,
  ShieldCheck,
  FileText,
  Settings,
  Scale,
  FlaskConical,
} from 'lucide-react'
import type { NavItem } from '@/types/common.types'

export const PATIENT_NAV: NavItem[] = [
  {
    href: '/patient',
    label: 'داشبورد',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/patient/symptoms',
    label: 'ثبت علائم',
    icon: Activity,
  },
  {
    href: '/patient/fluid',
    label: 'مصرف مایعات',
    icon: Droplets,
  },
  {
    href: '/patient/diet',
    label: 'رژیم غذایی',
    icon: Utensils,
  },
  {
    href: '/patient/messages',
    label: 'پیام‌ها',
    icon: MessageSquare,
  },
  {
    href: '/patient/education',
    label: 'آموزش',
    icon: BookOpen,
  },
]

export const CLINICIAN_NAV: NavItem[] = [
  {
    href: '/clinician',
    label: 'داشبورد',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/clinician/patients',
    label: 'بیماران',
    icon: Users,
  },
  {
    href: '/clinician/alerts',
    label: 'هشدارها',
    icon: Bell,
  },
  {
    href: '/clinician/recommendations',
    label: 'توصیه‌ها',
    icon: ClipboardList,
  },
]

export const ADMIN_NAV: NavItem[] = [
  {
    href: '/admin',
    label: 'داشبورد',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/admin/users',
    label: 'کاربران',
    icon: Users,
  },
  {
    href: '/admin/education',
    label: 'محتوای آموزشی',
    icon: BookOpen,
  },
  {
    href: '/admin/audit-logs',
    label: 'لاگ‌ها',
    icon: FileText,
  },
]