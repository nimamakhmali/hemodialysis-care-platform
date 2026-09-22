import { differenceInDays, differenceInHours, differenceInMinutes, parseISO, isValid } from 'date-fns';

export function formatPersianDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    if (!isValid(date)) return '—'
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  } catch {
    return '—'
  }
}

export function formatPersianDateShort(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    if (!isValid(date)) return '—'
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  } catch {
    return '—'
  }
}

export function formatPersianDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    if (!isValid(date)) return '—'
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return '—'
  }
}

export function formatPersianTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    if (!isValid(date)) return '—'
    return new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return '—'
  }
}

export function formatRelativeTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    if (!isValid(date)) return '—'
    const now = new Date()
    const diffMinutes = differenceInMinutes(now, date)
    const diffHours = differenceInHours(now, date)
    const diffDays = differenceInDays(now, date)

    if (diffMinutes < 1) return 'همین لحظه'
    if (diffMinutes < 60) return `${diffMinutes} دقیقه پیش`
    if (diffHours < 24) return `${diffHours} ساعت پیش`
    if (diffDays === 1) return 'دیروز'
    if (diffDays < 7) return `${diffDays} روز پیش`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} هفته پیش`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} ماه پیش`
    return `${Math.floor(diffDays / 365)} سال پیش`
  } catch {
    return '—'
  }
}

export function formatPersianMonth(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    if (!isValid(date)) return '—'
    return new Intl.DateTimeFormat('fa-IR', {
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return '—'
  }
}


export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function isToday(dateStr: string): boolean {
  return differenceInDays(new Date(), parseISO(dateStr)) === 0
}

export function daysBetween(from: string, to?: string): number {
  const toDate = to ? parseISO(to) : new Date()
  return Math.abs(differenceInDays(toDate, parseISO(from)))
}




/**
 * تبدیل تاریخ به فاصله زمانی فارسی
 * مثال: "۳ دقیقه پیش"، "۲ ساعت پیش"، "دیروز"
 */
export function formatDistanceToNow(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSeconds < 60) return 'همین الان'
    if (diffMinutes < 60) return `${diffMinutes} دقیقه پیش`
    if (diffHours < 24) return `${diffHours} ساعت پیش`
    if (diffDays === 1) return 'دیروز'
    if (diffDays < 7) return `${diffDays} روز پیش`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} هفته پیش`
    return `${Math.floor(diffDays / 30)} ماه پیش`
  } catch {
    return ''
  }
}

/**
 * فرمت تاریخ میلادی به فارسی خوانا
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  } catch {
    return dateStr
  }
}

/**
 * فرمت تاریخ + ساعت به فارسی
 */
export function formatDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return dateStr
  }
}

/**
 * فرمت تاریخ کوتاه
 */
export function formatShortDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('fa-IR', {
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch {
    return dateStr
  }
}

/**
 * تبدیل تاریخ به ISO string برای API
 */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * امروز به فرمت ISO
 */
export function todayISO(): string {
  return toISODate(new Date())
}