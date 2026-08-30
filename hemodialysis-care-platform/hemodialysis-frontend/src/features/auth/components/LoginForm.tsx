'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Phone, Lock, ArrowLeft, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@lib/utils/cn'
import { useAuth } from '../hooks/useAuth'
import { loginSchema, type LoginInput } from '@lib/utils/validation.utils'
import { Input } from '@components/ui/Input'
import { Button } from '@components/ui/Button'

export function LoginForm() {
  const { login, isLoading } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: LoginInput) => {
    setApiError(null)
    try {
      await login(data)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message
      setApiError(msg ?? 'شماره موبایل یا رمز عبور اشتباه است')
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Input
        label="شماره موبایل"
        placeholder="09123456789"
        type="tel"
        inputMode="numeric"
        autoComplete="username"
        leftIcon={<Phone className="h-4 w-4" />}
        error={errors.phone_number?.message}
        disabled={isLoading}
        {...register('phone_number')}
      />

      <Input
        label="رمز عبور"
        placeholder="رمز عبور خود را وارد کنید"
        autoComplete="current-password"
        showPasswordToggle
        leftIcon={<Lock className="h-4 w-4" />}
        error={errors.password?.message}
        disabled={isLoading}
        {...register('password')}
      />

      {/* API Error */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'flex items-start gap-3 p-3.5 rounded-xl',
            'bg-danger-light border border-danger-border'
          )}
        >
          <AlertCircle className="h-4 w-4 text-danger mt-0.5 flex-shrink-0" />
          <p className="text-sm text-danger-dark">{apiError}</p>
        </motion.div>
      )}

      <Button
        type="submit"
        fullWidth
        size="lg"
        isLoading={isLoading}
        loadingText="در حال ورود..."
        rightIcon={!isLoading ? <ArrowLeft className="h-4 w-4" /> : undefined}
        className="mt-2"
      >
        ورود به سامانه
      </Button>
    </motion.form>
  )
}