// ─────────────────────────────────────────────
// Motion Variants — سیستم انیمیشن یکپارچه
// تمام انیمیشن‌های پروژه از اینجا مدیریت می‌شوند
// ─────────────────────────────────────────────

import type { Variants } from "motion/react";

// ── Page Transitions ──────────────────────────
export const pageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.07,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(2px)",
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

// ── Stagger Container ─────────────────────────
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// ── Card Variants ─────────────────────────────
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// ── List Item Variants ────────────────────────
export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -12,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// ── Fade Up ───────────────────────────────────
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Scale In ──────────────────────────────────
export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Slide from Right ──────────────────────────
export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    x: -30,
    transition: { duration: 0.25 },
  },
};

// ── Number Counter ────────────────────────────
export const numberVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

// ── Glow Pulse ────────────────────────────────
export const glowPulse: Variants = {
  initial: { boxShadow: "0 0 0 0 rgba(14, 165, 233, 0)" },
  animate: {
    boxShadow: [
      "0 0 0 0 rgba(14, 165, 233, 0)",
      "0 0 0 8px rgba(14, 165, 233, 0.12)",
      "0 0 0 0 rgba(14, 165, 233, 0)",
    ],
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
  },
};

// ── Alert Shake ───────────────────────────────
export const alertShake: Variants = {
  initial: { x: 0 },
  animate: {
    x: [0, -4, 4, -4, 4, 0],
    transition: { duration: 0.4 },
  },
};

// ── Tooltip ───────────────────────────────────
export const tooltipVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.15, ease: "easeOut" },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.1 } },
};

// ── Progress Bar ──────────────────────────────
export const progressVariants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: (width: number) => ({
    scaleX: width / 100,
    originX: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 },
  }),
};

// ── Ease presets ──────────────────────────────
export const ease = {
  smooth: [0.22, 1, 0.36, 1] as const,
  spring: { type: "spring", stiffness: 300, damping: 30 } as const,
  springBouncy: { type: "spring", stiffness: 400, damping: 20 } as const,
};