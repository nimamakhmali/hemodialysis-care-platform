// ── Date Utilities ─────────────────────────────────────────────────────────
// تمام عملیات تاریخ از اینجا مدیریت می‌شود

/**
 * تاریخ امروز به فرمت ISO (YYYY-MM-DD)
 */
export function todayISO(): string {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

/**
 * فرمت تاریخ کوتاه: ۱۴ فروردین
 */
export function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('fa-IR', {
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/**
 * فرمت تاریخ کامل: ۱۴ فروردین ۱۴۰۴
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/**
 * فرمت تاریخ و ساعت: ۱۴ فروردین ۱۴۰۴، ساعت ۱۴:۳۰
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

/**
 * فاصله از الان: ۳ ساعت پیش
 */
export function formatDistanceToNow(
  dateStr: string | null | undefined
): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffMin < 1) return 'همین الان'
    if (diffMin < 60) return `${diffMin} دقیقه پیش`
    if (diffHour < 24) return `${diffHour} ساعت پیش`
    if (diffDay < 7) return `${diffDay} روز پیش`
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} هفته پیش`
    return formatShortDate(dateStr)
  } catch {
    return dateStr ?? '—'
  }
}

/**
 * تبدیل تاریخ میلادی به فارسی (ساده)
 */
export function toJalali(dateStr: string | null | undefined): string {
  return formatDate(dateStr)
}

/**
 * آیا تاریخ امروز است؟
 */
export function isToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  try {
    const date = new Date(dateStr)
    const today = new Date()
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  } catch {
    return false
  }
}

/**
 * n روز قبل
 */
export function daysAgo(n: number): string {
  const date = new Date()
  date.setDate(date.getDate() - n)
  return date.toISOString().split('T')[0]
}