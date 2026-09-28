import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { QueryProvider } from '@/providers/QueryProvider'
import { AuthProvider } from '@/providers/AuthProvider'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'سامانه دیالیز',
    template: '%s — سامانه دیالیز',
  },
  description: 'سامانه پایش هوشمند بیماران همودیالیز',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans antialiased bg-[#F0F9FF]">
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    fontFamily: 'Vazirmatn, sans-serif',
                    direction: 'rtl',
                    borderRadius: '12px',
                    fontSize: '13px',
                    padding: '12px 16px',
                  },
                  success: {
                    iconTheme: { primary: '#22C55E', secondary: '#fff' },
                  },
                  error: {
                    iconTheme: { primary: '#EF4444', secondary: '#fff' },
                    duration: 5000,
                  },
                }}
              />
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}