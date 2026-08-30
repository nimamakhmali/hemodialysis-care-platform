import type { Metadata } from 'next'
import { LoginPageClient } from './LoginPageClient'

export const metadata: Metadata = {
  title: 'ورود به سامانه',
}

export default function LoginPage() {
  return <LoginPageClient />
}