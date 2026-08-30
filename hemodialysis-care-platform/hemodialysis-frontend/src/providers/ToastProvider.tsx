'use client'

import { Toaster } from 'react-hot-toast'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={10}
        containerStyle={{
          direction: 'rtl',
          fontFamily: 'Vazirmatn, sans-serif',
        }}
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'Vazirmatn, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '14px',
            padding: '14px 18px',
            direction: 'rtl',
            textAlign: 'right',
            maxWidth: '420px',
            boxShadow: '0 8px 32px rgba(14, 165, 233, 0.15)',
            border: '1px solid rgba(186, 230, 253, 0.4)',
          },
          success: {
            style: {
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              color: '#15803d',
              borderColor: '#bbf7d0',
            },
            iconTheme: {
              primary: '#22c55e',
              secondary: '#ffffff',
            },
          },
          error: {
            style: {
              background: 'linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)',
              color: '#b91c1c',
              borderColor: '#fecaca',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
            duration: 5000,
          },
          loading: {
            style: {
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              color: '#0284c7',
              borderColor: '#bae6fd',
            },
          },
        }}
      />
    </>
  )
}