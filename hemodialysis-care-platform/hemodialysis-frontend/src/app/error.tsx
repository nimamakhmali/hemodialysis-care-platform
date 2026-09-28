'use client'

import { useEffect } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[app/error]', error)
    }
  }, [error])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #F0F9FF 0%, #ECFEFF 100%)' }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 mb-4">
        <AlertTriangle className="h-7 w-7 text-red-500" />
      </div>
      <h2 className="text-lg font-semibold text-slate-800 mb-2">
        خطایی رخ داده است
      </h2>
      <p className="text-slate-500 text-sm mb-6 text-center max-w-xs">
        مشکلی پیش آمده است. لطفاً دوباره تلاش کنید.
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 rounded-xl bg-[#0EA5E9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0284C7]"
      >
        <RefreshCw className="h-4 w-4" />
        تلاش مجدد
      </button>
    </div>
  )
}