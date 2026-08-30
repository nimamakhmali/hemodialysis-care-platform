// src/features/admin/components/UserForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import type { AdminUser } from "../types/admin.types";
import { cn } from "@/lib/utils/cn";

const createSchema = z.object({
  phone_number: z
    .string()
    .regex(/^09\d{9}$/, "فرمت موبایل صحیح نیست (09XXXXXXXXX)"),
  full_name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
  role: z.enum(["patient", "clinician", "admin"]),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
});

const updateSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone_number: z
    .string()
    .regex(/^09\d{9}$/)
    .optional(),
  role: z.enum(["patient", "clinician", "admin"]).optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

const ROLE_OPTIONS = [
  { value: "patient", label: "بیمار" },
  { value: "clinician", label: "کلینیسین" },
  { value: "admin", label: "مدیر" },
];

interface Props {
  user?: AdminUser;
  onSubmit: (data: CreateForm | UpdateForm) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export function UserForm({ user, onSubmit, onClose, isLoading }: Props) {
  const isEdit = !!user;
  const schema = isEdit ? updateSchema : createSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateForm>({
    resolver: zodResolver(schema as z.ZodType<CreateForm>),
    defaultValues: user
      ? {
          full_name: user.full_name,
          phone_number: user.phone_number,
          role: user.role,
        }
      : undefined,
  });

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 
                        border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">
            {isEdit ? "ویرایش کاربر" : "کاربر جدید"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit as (data: CreateForm) => Promise<void>)}
          className="p-6 space-y-4"
        >
          {/* Full Name */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              نام کامل
            </label>
            <input
              {...register("full_name")}
              placeholder="نام و نام خانوادگی"
              className={cn(
                "w-full rounded-xl border px-4 py-2.5 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-sky-500/30",
                errors.full_name
                  ? "border-red-300 focus:border-red-400"
                  : "border-slate-200 focus:border-sky-400"
              )}
            />
            {errors.full_name && (
              <p className="text-xs text-red-500 mt-1">
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              شماره موبایل
            </label>
            <input
              {...register("phone_number")}
              placeholder="09XXXXXXXXX"
              dir="ltr"
              className={cn(
                "w-full rounded-xl border px-4 py-2.5 text-sm text-left",
                "focus:outline-none focus:ring-2 focus:ring-sky-500/30",
                errors.phone_number
                  ? "border-red-300 focus:border-red-400"
                  : "border-slate-200 focus:border-sky-400"
              )}
            />
            {errors.phone_number && (
              <p className="text-xs text-red-500 mt-1">
                {errors.phone_number.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              نقش
            </label>
            <select
              {...register("role")}
              className={cn(
                "w-full rounded-xl border px-4 py-2.5 text-sm bg-white",
                "focus:outline-none focus:ring-2 focus:ring-sky-500/30",
                "border-slate-200 focus:border-sky-400"
              )}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Password — only for create */}
          {!isEdit && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                رمز عبور
              </label>
              <input
                {...register("password")}
                type="password"
                placeholder="حداقل ۸ کاراکتر"
                className={cn(
                  "w-full rounded-xl border px-4 py-2.5 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-sky-500/30",
                  errors.password
                    ? "border-red-300 focus:border-red-400"
                    : "border-slate-200 focus:border-sky-400"
                )}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 
                         text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 
                         text-white text-sm font-medium transition-colors 
                         disabled:opacity-60"
            >
              {isLoading ? "در حال ذخیره..." : isEdit ? "ذخیره" : "ایجاد"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}