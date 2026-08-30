"use client";

import { motion } from "motion/react";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AlertSeverity } from "@/types/common.types";

const CONFIG = {
  high: {
    Icon: AlertTriangle,
    bg: "bg-red-100",
    text: "text-red-600",
    ring: "ring-red-200",
    pulse: true,
  },
  medium: {
    Icon: AlertCircle,
    bg: "bg-amber-100",
    text: "text-amber-600",
    ring: "ring-amber-200",
    pulse: false,
  },
  low: {
    Icon: Info,
    bg: "bg-blue-100",
    text: "text-blue-600",
    ring: "ring-blue-200",
    pulse: false,
  },
};

interface AlertSeverityIconProps {
  severity: AlertSeverity;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AlertSeverityIcon({
  severity,
  size = "md",
  className,
}: AlertSeverityIconProps) {
  const cfg = CONFIG[severity];
  const sizes = { sm: "h-7 w-7", md: "h-9 w-9", lg: "h-11 w-11" };
  const iconSizes = { sm: "h-3.5 w-3.5", md: "h-4.5 w-4.5", lg: "h-6 w-6" };

  return (
    <motion.div
      className={cn(
        "flex items-center justify-center rounded-xl ring-1",
        sizes[size],
        cfg.bg,
        cfg.ring,
        className
      )}
      animate={cfg.pulse ? { scale: [1, 1.08, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <cfg.Icon className={cn(iconSizes[size], cfg.text)} />
    </motion.div>
  );
}