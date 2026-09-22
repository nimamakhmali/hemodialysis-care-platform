import { Heart } from 'lucide-react'

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F0F9FF]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] shadow-lg shadow-[#0EA5E9]/20 animate-pulse">
          <Heart className="h-8 w-8 text-white" />
        </div>
        <p className="text-sm font-medium text-[#64748B] animate-pulse">
          در حال بارگذاری...
        </p>
      </div>
    </div>
  )
}