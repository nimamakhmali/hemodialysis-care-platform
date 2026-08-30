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

export function toISODate(dateStr: string): string {
  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return dateStr
    return date.toISOString().split('T')[0]
  } catch {
    return dateStr
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


