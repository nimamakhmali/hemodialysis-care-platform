// src/features/education/components/EducationForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import type { EducationContent } from "../types/education.types";
import { EDUCATION_TAG_LABELS } from "../types/education.types";
import { cn } from "@/lib/utils/cn";

const schema = z.object({
  topic_code: z
    .string()
    .min(2)
    .regex(/^[A-Z_]+$/, "فقط حروف بزرگ و زیرخط"),
  title_fa: z.string().min(3, "عنوان باید حداقل ۳ کاراکتر باشد"),
  content_fa: z.string().min(20, "محتوا باید حداقل ۲۰ کاراکتر باشد"),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  content?: EducationContent;
  onSubmit: (data: Partial<EducationContent>) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export function EducationForm({ content, onSubmit, onClose, isLoading }: Props) {
  const isEdit = !!content;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: content
      ? {
          topic_code: content.topic_code,
          title_fa: content.title_fa,
          content_fa: content.content_fa,
          is_active: content.is_active,
        }
      : { is_active: true },
  });

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl 
                      max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between 
                        px-6 py-4 border-b border-slate-100 rounded-t-2xl z-10">
          <h3 className="font-semibold text-slate-800">
            {isEdit ? "ویرایش محتوا" : "محتوای جدید"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit as (data: FormData) => Promise<void>)}
          className="p-6 space-y-5"
        >
          {/* Topic Code */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              کد موضوع (انگلیسی بزرگ)
            </label>
            <input
              {...register("topic_code")}
              placeholder="مثال: HIGH_K"
              dir="ltr"
              disabled={isEdit}
              className={cn(
                "w-full rounded-xl border px-4 py-2.5 text-sm font-mono",
                "focus:outline-none focus:ring-2 focus:ring-sky-500/30",
                errors.topic_code
                  ? "border-red-300"
                  : "border-slate-200 focus:border-sky-400",
                isEdit && "bg-slate-50 opacity-60"
              )}
            />
            {errors.topic_code && (
              <p className="text-xs text-red-500 mt-1">
                {errors.topic_code.message}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              عنوان فارسی
            </label>
            <input
              {...register("title_fa")}
              placeholder="عنوان محتوای آموزشی"
              className={cn(
                "w-full rounded-xl border px-4 py-2.5 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-sky-500/30",
                errors.title_fa
                  ? "border-red-300"
                  : "border-slate-200 focus:border-sky-400"
              )}
            />
            {errors.title_fa && (
              <p className="text-xs text-red-500 mt-1">
                {errors.title_fa.message}
              </p>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              متن محتوا
            </label>
            <textarea
              {...register("content_fa")}
              rows={10}
              placeholder="متن کامل آموزشی را وارد کنید..."
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-sky-500/30",
                "resize-none leading-relaxed",
                errors.content_fa
                  ? "border-red-300"
                  : "border-slate-200 focus:border-sky-400"
              )}
            />
            {errors.content_fa && (
              <p className="text-xs text-red-500 mt-1">
                {errors.content_fa.message}
              </p>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              {...register("is_active")}
              className="w-4 h-4 rounded border-slate-300 
                         text-sky-500 focus:ring-sky-500"
            />
            <label
              htmlFor="is_active"
              className="text-sm text-slate-700"
            >
              محتوا فعال باشد
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 
                         text-sm text-slate-600 hover:bg-slate-50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 
                         text-white text-sm font-medium disabled:opacity-60"
            >
              {isLoading ? "در حال ذخیره..." : isEdit ? "ذخیره" : "ایجاد"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}