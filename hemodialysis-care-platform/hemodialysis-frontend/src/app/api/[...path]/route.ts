/**
 * This API proxy route is NOT USED in the current architecture.
 * The frontend communicates directly with FastAPI at NEXT_PUBLIC_API_URL.
 *
 * This file is intentionally kept as a stub to prevent 404 errors
 * if any stale references exist, but it does nothing.
 *
 * Do NOT use this proxy. Use apiClient from @/lib/api/client directly.
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'API proxy is disabled. Use NEXT_PUBLIC_API_URL directly.' },
    { status: 501 }
  )
}

export async function POST() {
  return NextResponse.json(
    { error: 'API proxy is disabled.' },
    { status: 501 }
  )
}