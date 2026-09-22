import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Route definitions
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password']
const PATIENT_ROUTES = ['/patient']
const CLINICIAN_ROUTES = ['/clinician']
const ADMIN_ROUTES = ['/admin']

function getTokenFromRequest(request: NextRequest): string | null {
  // Cookie-based token
  const cookieToken = request.cookies.get('access_token')?.value
  if (cookieToken) return cookieToken
  return null
}

function parseJWTPayload(token: string): {
  sub?: string
  role?: string
  exp?: number
} | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    )
    return payload
  } catch {
    return null
  }
}

function isTokenExpired(payload: { exp?: number }): boolean {
  if (!payload.exp) return false
  return Date.now() / 1000 > payload.exp
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Root redirect
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const isPublicRoute = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  )

  const token = getTokenFromRequest(request)

  // No token → redirect to login for protected routes
  if (!token && !isPublicRoute) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // Has token on login page → redirect to dashboard
  if (token && isPublicRoute) {
    const payload = parseJWTPayload(token)
    if (payload && !isTokenExpired(payload)) {
      const role = payload.role
      const dest =
        role === 'admin'
          ? '/admin'
          : role === 'clinician'
          ? '/clinician'
          : '/patient'
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  // Role-based access control
  if (token) {
    const payload = parseJWTPayload(token)

    if (!payload || isTokenExpired(payload)) {
      // Expired token
      if (!isPublicRoute) {
        const url = new URL('/login', request.url)
        url.searchParams.set('from', pathname)
        const response = NextResponse.redirect(url)
        response.cookies.delete('access_token')
        return response
      }
      return NextResponse.next()
    }

    const role = payload.role

    const isAdminRoute = ADMIN_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(r + '/')
    )
    const isClinicianRoute = CLINICIAN_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(r + '/')
    )
    const isPatientRoute = PATIENT_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(r + '/')
    )

    // Admin can access everything
    if (role === 'admin') {
      return NextResponse.next()
    }

    // Clinician cannot access admin routes
    if (role === 'clinician' && isAdminRoute) {
      return NextResponse.redirect(new URL('/clinician', request.url))
    }

    // Patient cannot access clinician or admin routes
    if (role === 'patient' && (isClinicianRoute || isAdminRoute)) {
      return NextResponse.redirect(new URL('/patient', request.url))
    }

    // Clinician trying to access patient routes → redirect to clinician
    if (role === 'clinician' && isPatientRoute) {
      return NextResponse.redirect(new URL('/clinician', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}