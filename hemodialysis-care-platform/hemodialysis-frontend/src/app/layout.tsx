import type { Metadata, Viewport } from 'next'
import { QueryProvider } from '@providers/QueryProvider'
import { AuthProvider } from '@providers/AuthProvider'
import { ToastProvider } from '@providers/ToastProvider'
import '@/styles/fonts.css'
import '@/styles/globals.css'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: { default: 'سامانه پایش دیالیز', template: '%s | سامانه پایش دیالیز' },
  description: 'سامانه جامع مانیتورینگ، آموزش و پایش بیماران همودیالیز',
  robots: 'noindex, nofollow',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0EA5E9',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body>
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}