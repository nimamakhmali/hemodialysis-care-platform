'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { ArrowRight, BookOpen } from 'lucide-react'
import { useEducationDetail } from '@/features/education/hooks/useEducation'
import { PageLoader } from '@/components/feedback/PageLoader'
import { pageVariants } from '@/lib/animation/variants'
import { formatDate } from '@/lib/utils/date.utils'

export default function EducationDetailPage({
  params,
}: {
  params: Promise<{ topic: string }>
}) {
  const { topic } = use(params)
  const router = useRouter()
  const { data, isLoading, isError } = useEducationDetail(topic)

  if (isLoading) return <PageLoader />

  if (isError || !data) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500">محتوا یافت نشد</p>
        <button
          onClick={() => router.back()}
          className="mt-3 text-sm text-primary-500"
        >
          بازگشت
        </button>
      </div>
    )
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto space-y-5"
    >
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600"
      >
        <ArrowRight className="h-4 w-4" />
        بازگشت
      </button>

      {/* Article */}
      <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
            <BookOpen className="h-5 w-5 text-primary-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">{data.title_fa}</h1>
            <p className="text-xs text-slate-400">
              آخرین بروزرسانی: {formatDate(data.updated_at)}
            </p>
          </div>
        </div>

        {/* Tags */}
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] text-primary-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
          {data.content_fa}
        </div>
      </article>
    </motion.div>
  )
}