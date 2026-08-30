// src/features/dashboard/components/patient/TodayTasksWidget.tsx
"use client";

import { motion } from "motion/react";
import { CheckCircle, Circle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface Task {
  id: string;
  label: string;
  done: boolean;
  href: string;
}

interface Props {
  tasks: Task[];
}

export function TodayTasksWidget({ tasks }: Props) {
  const doneCount = tasks.filter((t) => t.done).length;
  const totalCount = tasks.length;
  const allDone = doneCount === totalCount;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            کارهای امروز
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {doneCount} از {totalCount} انجام شده
          </p>
        </div>
        {allDone && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-xs bg-emerald-100 text-emerald-700 
                       px-2 py-1 rounded-full font-medium"
          >
            عالی! 🎉
          </motion.span>
        )}
      </div>

      {/* Progress */}
      <div className="h-1.5 rounded-full bg-slate-100 mb-4 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"
          initial={{ width: 0 }}
          animate={{ width: `${(doneCount / totalCount) * 100}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {tasks.map((task, idx) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.06 }}
          >
            <Link
              href={task.href}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all group",
                task.done
                  ? "bg-slate-50 opacity-60"
                  : "bg-sky-50/60 hover:bg-sky-50 border border-sky-100/60"
              )}
            >
              {task.done ? (
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-sky-400 shrink-0" />
              )}
              <span
                className={cn(
                  "text-sm flex-1",
                  task.done
                    ? "text-slate-400 line-through"
                    : "text-slate-700 font-medium"
                )}
              >
                {task.label}
              </span>
              {!task.done && (
                <ArrowLeft
                  className="w-4 h-4 text-sky-400 opacity-0 
                               group-hover:opacity-100 transition-opacity"
                />
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}