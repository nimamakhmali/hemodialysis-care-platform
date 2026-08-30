import type { LabTestCode } from '@appTypes/common.types'
import { LAB_UNITS } from '@config/constants'

export function formatWeight(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(decimals)} kg`
}

export function formatWeightChange(
  value: number | null | undefined
): string {
  if (value === null || value === undefined) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)} kg`
}

export function formatBP(
  systolic: number | null | undefined,
  diastolic: number | null | undefined
): string {
  if (!systolic || !diastolic) return '—'
  return `${systolic}/${diastolic}`
}

export function formatLabValue(
  value: number | null | undefined,
  testCode?: LabTestCode,
  decimals = 1
): string {
  if (value === null || value === undefined) return '—'
  const unit = testCode ? LAB_UNITS[testCode] : ''
  return `${value.toFixed(decimals)}${unit ? ` ${unit}` : ''}`
}

export function formatPercent(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(decimals)}٪`
}

export function formatFluidML(ml: number | null | undefined): string {
  if (ml === null || ml === undefined) return '—'
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)} لیتر`
  return `${ml} ml`
}

export function formatNumber(
  value: number | null | undefined,
  decimals = 0
): string {
  if (value === null || value === undefined) return '—'
  return value.toFixed(decimals)
}

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} دقیقه`
  if (m === 0) return `${h} ساعت`
  return `${h} ساعت و ${m} دقیقه`
}

export function formatPhoneNumber(phone: string): string {
  if (!phone || phone.length !== 11) return phone
  return `${phone.slice(0, 4)}-${phone.slice(4, 7)}-${phone.slice(7)}`
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

export function formatMedicalRecordNumber(mrn: string): string {
  return `#${mrn}`
}