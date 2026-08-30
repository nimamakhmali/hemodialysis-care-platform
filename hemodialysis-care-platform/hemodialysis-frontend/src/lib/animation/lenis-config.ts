// ─────────────────────────────────────────────
// Lenis — Smooth Scroll Configuration
// ─────────────────────────────────────────────

export const lenisOptions = {
  duration: 1.2,
  easing: (t: number): number => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: "vertical" as const,
  gestureOrientation: "vertical" as const,
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 2,
};