"use client";

import { motion } from "motion/react";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useAcknowledgeAlert, useResolveAlert } from "../hooks/useAlerts";
import type { Alert } from "../types/alert.types";

interface AlertActionButtonsProps {
  alert: Alert;
  showViewProfile?: boolean;
  className?: string;
}

export function AlertActionButtons({
  alert,
  showViewProfile = true,
  className,
}: AlertActionButtonsProps) {
  const router = useRouter();
  const acknowledge = useAcknowledgeAlert();
  const resolve = useResolveAlert();

  const isNew = alert.status === "new";
  const isAcked = alert.status === "acknowledged";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* View Patient */}
      {showViewProfile && (
        <motion.button
          onClick={() => router.push(`/clinician/patients/${alert.patient_id}`)}
          className="flex items-center gap-1.5 rounded-lg border border-primary-100 bg-white px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <ExternalLink className="h-3 w-3" />
          پرونده بیمار
        </motion.button>
      )}

      {/* Acknowledge */}
      {isNew && (
        <motion.button
          onClick={() => acknowledge.mutate({ alertId: alert.id })}
          disabled={acknowledge.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 ring-1 ring-primary-200 hover:bg-primary-100 transition-colors disabled:opacity-50"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <CheckCircle className="h-3 w-3" />
          تأیید دیدن
        </motion.button>
      )}

      {/* Resolve */}
      {(isNew || isAcked) && (
        <motion.button
          onClick={() => resolve.mutate({ alertId: alert.id })}
          disabled={resolve.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <XCircle className="h-3 w-3" />
          بستن
        </motion.button>
      )}
    </div>
  );
}