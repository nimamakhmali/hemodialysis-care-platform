// src/features/messages/components/MessagesPageView.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, CheckCheck, Mail, MailOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  useMessages,
  useMarkMessageRead,
  useMarkAllRead,
  useUnreadCount,
} from "../hooks/useMessages";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/date.utils";
import type { PatientMessage } from "../types/message.types";

interface MessageCardProps {
  message: PatientMessage;
  onRead: (id: string) => void;
}

function MessageCard({ message, onRead }: MessageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isUnread = !message.read_at;

  function handleExpand() {
    setExpanded((p) => !p);
    if (isUnread) onRead(message.id);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border bg-white overflow-hidden cursor-pointer",
        "hover:shadow-sm transition-shadow",
        isUnread ? "border-sky-200" : "border-slate-100"
      )}
      onClick={handleExpand}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="h-0.5 bg-gradient-to-r from-sky-400 to-cyan-400" />
      )}

      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
              isUnread ? "bg-sky-100" : "bg-slate-100"
            )}
          >
            {isUnread ? (
              <Mail className="w-4 h-4 text-sky-600" />
            ) : (
              <MailOpen className="w-4 h-4 text-slate-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4
                className={cn(
                  "text-sm leading-snug",
                  isUnread
                    ? "font-semibold text-slate-800"
                    : "font-medium text-slate-600"
                )}
              >
                {message.title}
              </h4>
              <span className="text-xs text-slate-400 shrink-0">
                {formatRelativeTime(message.sent_at)}
              </span>
            </div>

            {/* Unread badge */}
            {isUnread && (
              <span className="inline-block mt-1 text-[10px] bg-sky-100 
                               text-sky-700 px-2 py-0.5 rounded-full font-medium">
                جدید
              </span>
            )}
          </div>
        </div>

        {/* Content — expanded */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                {message.sent_by && (
                  <p className="mt-3 text-xs text-slate-400">
                    ارسال‌کننده: تیم درمان
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface Props {
  patientId: string;
}

export function MessagesPageView({ patientId }: Props) {
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: messages, isLoading } = useMessages(patientId, {
    unread_only: filter === "unread",
  });
  const { data: unreadCount = 0 } = useUnreadCount(patientId);
  const markRead = useMarkMessageRead(patientId);
  const markAllRead = useMarkAllRead(patientId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="پیام‌ها"
        description="پیام‌های تیم درمان"
        icon={<MessageSquare className="w-5 h-5" />}
        actions={
          unreadCount > 0 ? (
            <button
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1.5 text-xs text-sky-600 
                         hover:text-sky-700 transition-colors px-3 py-2 
                         rounded-xl border border-sky-200 bg-sky-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              خواندن همه
            </button>
          ) : undefined
        }
      />

      {/* Filter */}
      <div className="flex items-center gap-2">
        {[
          { value: "all" as const, label: "همه پیام‌ها" },
          {
            value: "unread" as const,
            label: `خوانده‌نشده${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
          },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
              filter === value
                ? "bg-sky-500 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : !messages || messages.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
          <MessageSquare className="w-12 h-12 opacity-20" />
          <p className="text-sm">
            {filter === "unread"
              ? "پیام خوانده‌نشده‌ای ندارید"
              : "پیامی دریافت نشده"}
          </p>
        </div>
      ) : (
        <motion.div layout className="space-y-3">
          {messages.map((msg) => (
            <MessageCard
              key={msg.id}
              message={msg}
              onRead={(id) => markRead.mutate(id)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}