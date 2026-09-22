'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, ChevronLeft } from 'lucide-react'
import type { EducationContentItem } from '@/types/api.types'

interface EducationCardProps {
  item: EducationContentItem
}

export function EducationCard({ item }: EducationCardProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(`/patient/education/${item.topic_code}`)}
      className="
        w-full text-right rounded-2xl border border-slate-100 bg-white p-4
        shadow-sm hover:shadow-md hover:border-primary-200
        transition-all duration-200 group
      "
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50">
          <BookOpen className="h-4 w-4 text-primary-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-700">
            {item.title_fa}
          </p>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {item.content_fa.slice(0, 100)}...
          </p>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronLeft className="h-4 w-4 text-slate-300 group-hover:text-primary-400 shrink-0 mt-1" />
      </div>
    </button>
  )
}