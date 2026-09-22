import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { QueryProvider } from '@/providers/QueryProvider'
import { AuthProvider } from '@/providers/AuthProvider'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'سامانه دیالیز | پایش هوشمند بیماران',
  description: 'سامانه مانیتورینگ و آموزش بیماران همودیالیز',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans antialiased">
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
                },
                success: {
                  iconTheme: { primary: '#22C55E', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#EF4444', secondary: '#fff' },
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}