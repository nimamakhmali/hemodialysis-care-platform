'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { ArrowRight, Save, Eye, EyeOff } from 'lucide-react'
import { useEducationDetail, useUpdateEducation } from '@/features/education/hooks/useEducation'
import { PageLoader } from '@/components/feedback/PageLoader'
import { pageVariants } from '@/lib/animation/variants'
import toast from 'react-hot-toast'

export default function AdminEducationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const isNew = id === 'new'

  // For existing items, fetch by topic_code or id
  const { data: item, isLoading } = useEducationDetail(isNew ? '' : id)
  const updateMutation = useUpdateEducation()

  const [form, setForm] = useState({
    topic_code: '',
    title_fa: '',
    content_fa: '',
    tags: '',
    is_active: true,
  })

  useEffect(() => {
    if (item) {
      setForm({
        topic_code: item.topic_code,
        title_fa: item.title_fa,
        content_fa: item.content_fa,
        tags: item.tags.join(', '),
        is_active: item.is_active,
      })
    }
  }, [item])

  if (!isNew && isLoading) return <PageLoader />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title_fa.trim() || !form.content_fa.trim()) {
      toast.error('عنوان و متن محتوا الزامی است')
      return
    }

    const payload = {
      topic_code: form.topic_code.trim() || undefined,
      title_fa: form.title_fa.trim(),
      content_fa: form.content_fa.trim(),
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      is_active: form.is_active,
    }

    await updateMutation.mutateAsync({ id, data: payload })
    router.push('/admin/education')
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5 max-w-2xl mx-auto"
    >
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0EA5E9]"
      >
        <ArrowRight className="h-4 w-4" />
        بازگشت
      </button>

      <h1 className="text-xl font-bold text-slate-800">
        {isNew ? 'محتوای جدید' : 'ویرایش محتوا'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
          {/* Topic code */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600">
              کد موضوع
            </label>
            <input
              value={form.topic_code}
              onChange={(e) =>
                setForm((p) => ({ ...p, topic_code: e.target.value }))
              }
              placeholder="مثلاً HIGH_K"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono focus:border-[#0EA5E9] focus:outline-none"
              disabled={!isNew}
            />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600">
              عنوان فارسی *
            </label>
            <input
              value={form.title_fa}
              onChange={(e) =>
                setForm((p) => ({ ...p, title_fa: e.target.value }))
              }
              placeholder="عنوان مطلب آموزشی"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-[#0EA5E9] focus:outline-none"
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600">
              متن محتوا *
            </label>
            <textarea
              value={form.content_fa}
              onChange={(e) =>
                setForm((p) => ({ ...p, content_fa: e.target.value }))
              }
              rows={12}
              placeholder="متن کامل مطلب آموزشی را اینجا بنویسید..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm resize-y focus:border-[#0EA5E9] focus:outline-none leading-relaxed"
              required
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600">
              برچسب‌ها (جداشده با کاما)
            </label>
            <input
              value={form.tags}
              onChange={(e) =>
                setForm((p) => ({ ...p, tags: e.target.value }))
              }
              placeholder="مثلاً: پتاسیم, رژیم, آزمایش"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-[#0EA5E9] focus:outline-none"
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              نمایش به بیماران
            </span>
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({ ...p, is_active: !p.is_active }))
              }
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                form.is_active
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
            >
              {form.is_active ? (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  فعال
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  غیرفعال
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={updateMutation.isPending}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-[#0EA5E9] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0284C7] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}