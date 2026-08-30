"use client";

import { motion } from "motion/react";

export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      {/* Animated logo mark */}
      <motion.div className="relative h-14 w-14">
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-primary-200"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-2 rounded-xl border-2 border-primary-400"
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-4 rounded-lg bg-gradient-to-br from-primary-400 to-cyan-400" />
      </motion.div>

      <motion.p
        className="text-sm text-slate-500"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        در حال بارگذاری...
      </motion.p>
    </div>
  );
}