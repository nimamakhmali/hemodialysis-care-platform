// ─────────────────────────────────────────────
// GSAP Utilities — برای انیمیشن‌های پیچیده‌تر
// ─────────────────────────────────────────────

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register plugins — فقط یک بار در کل اپلیکیشن
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * انیمیشن ورود کارت با stagger
 */
export function animateCardsIn(
  selector: string,
  container?: Element | null
): gsap.core.Timeline {
  const ctx = container ?? document;
  const elements = ctx.querySelectorAll(selector);

  return gsap
    .timeline()
    .fromTo(
      elements,
      { opacity: 0, y: 30, scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.07,
        ease: "power3.out",
        clearProps: "all",
      }
    );
}

/**
 * انیمیشن counter برای اعداد
 */
export function animateCounter(
  element: HTMLElement,
  from: number,
  to: number,
  duration = 1.2
): void {
  const obj = { value: from };

  gsap.to(obj, {
    value: to,
    duration,
    ease: "power2.out",
    onUpdate() {
      element.textContent = Math.round(obj.value).toString();
    },
  });
}

/**
 * انیمیشن progress bar با GSAP
 */
export function animateProgressBar(
  element: HTMLElement,
  targetWidth: number,
  delay = 0.3
): void {
  gsap.fromTo(
    element,
    { width: "0%" },
    {
      width: `${targetWidth}%`,
      duration: 1,
      delay,
      ease: "power2.inOut",
    }
  );
}

/**
 * Magnetic hover effect
 */
export function createMagneticEffect(
  element: HTMLElement,
  strength = 0.3
): () => void {
  const handleMouseMove = (e: MouseEvent): void => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    gsap.to(element, {
      x: deltaX,
      y: deltaY,
      duration: 0.4,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = (): void => {
    gsap.to(element, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.5)" });
  };

  element.addEventListener("mousemove", handleMouseMove);
  element.addEventListener("mouseleave", handleMouseLeave);

  return () => {
    element.removeEventListener("mousemove", handleMouseMove);
    element.removeEventListener("mouseleave", handleMouseLeave);
  };
}

/**
 * Scroll-triggered fade in
 */
export function createScrollReveal(
  elements: NodeListOf<Element> | Element[],
  options?: ScrollTrigger.StaticVars
): ScrollTrigger[] {
  return Array.from(elements).map((el) =>
    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      onEnter: () => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }
        );
      },
      once: true,
      ...options,
    })
  );
}

export { gsap };