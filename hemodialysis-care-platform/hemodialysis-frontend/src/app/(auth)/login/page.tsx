import { LoginPageClient } from './LoginPageClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ورود — سامانه دیالیز',
}

export default function LoginPage() {
  return <LoginPageClient />
}