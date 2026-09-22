'use client'

import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, Activity, Droplets, Utensils } from 'lucide-react'

interface TodayTasksWidgetProps {
  tasks: {
    symptoms_logged: boolean
    fluid_logged: boolean
    diet_logged: boolean
  }
}

export function TodayTasksWidget({ tasks }: TodayTasksWidgetProps) {
  const router = useRouter()

  const items = [
    {
      done: tasks.symptoms_logged,
      label: 'ثبت علائم امروز',
      href: '/patient/symptoms',
      icon: Activity,
    },
    {
      done: tasks.fluid_logged,
      label: 'ثبت مایعات امروز',
      href: '/patient/fluid',
      icon: Droplets,
    },
    {
      done: tasks.diet_logged,
      label: 'ثبت رژیم امروز',
      href: '/patient/diet',
      icon: Utensils,
    },
  ]

  const doneCount = items.filter((i) => i.done).length

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800">وظایف امروز</h3>
        <span className="text-xs text-slate-400">
          {doneCount}/{items.length} انجام‌شده
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <button
              onClick={() => !item.done && router.push(item.href)}
              className={`
                flex w-full items-center gap-3 rounded-xl px-3 py-2.5
                transition-colors text-right
                ${item.done
                  ? 'bg-emerald-50 cursor-default'
                  : 'bg-slate-50 hover:bg-primary-50 cursor-pointer'
                }
              `}
            >
              {item.done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-slate-300" />
              )}
              <item.icon
                className={`h-4 w-4 shrink-0 ${item.done ? 'text-emerald-400' : 'text-slate-400'}`}
              />
              <span
                className={`text-xs font-medium ${item.done ? 'text-emerald-700 line-through' : 'text-slate-700'}`}
              >
                {item.label}
              </span>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}