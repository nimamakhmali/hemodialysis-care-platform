// src/app/(dashboard)/clinician/patients/[id]/labs/new/page.tsx
'use client'

import { motion } from 'motion/react'
import { FlaskConical } from 'lucide-react'
import { pageVariants } from '@/lib/animation/variants'

export default function NewLabPanelPage() {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-2xl space-y-6 p-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
          <FlaskConical className="h-5 w-5 text-primary-500" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-800"> ثبت آزمایش جدید</h1>
          <p className="text-xs text-slate-400">افزودن نتایج آزمایش برای این بیمار</p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
        <FlaskConical className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-400">فرم ثبت آزمایش در دست توسعه است</p>
      </div>
    </motion.div>
  )
}