'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  decimals?: number
}

export function AnimatedNumber({
  value,
  duration = 600,
  decimals = 0,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const startValueRef = useRef(0)

  useEffect(() => {
    const startValue = startValueRef.current
    const diff = value - startValue

    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplay(startValue + diff * eased)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        startValueRef.current = value
        startRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return <span>{display.toFixed(decimals)}</span>
}