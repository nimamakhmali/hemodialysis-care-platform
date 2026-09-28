import Link from 'next/link'
import { Heart, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #F0F9FF 0%, #ECFEFF 100%)' }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] mb-6">
        <Heart className="h-8 w-8 text-white" />
      </div>
      <h1 className="text-4xl font-bold text-[#0F172A] mb-2">۴۰۴</h1>
      <p className="text-slate-500 mb-6 text-center">
        صفحه‌ای که دنبالش هستید وجود ندارد
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 rounded-xl bg-[#0EA5E9] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0284C7]"
      >
        <Home className="h-4 w-4" />
        بازگشت به صفحه اصلی
      </Link>
    </div>
  )
}