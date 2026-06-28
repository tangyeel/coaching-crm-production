'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  value: number
  duration?: number
  formatter?: (n: number) => string
  decimals?: number
  prefix?: string
  suffix?: string
}

export default function CountUp({
  value,
  duration = 800,
  formatter,
  decimals = 0,
  prefix = '',
  suffix = '',
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const prevValueRef = useRef(0)
  const latestFormatterRef = useRef(formatter)
  latestFormatterRef.current = formatter

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const startVal = prevValueRef.current
    const endVal = value
    prevValueRef.current = value

    if (startVal === endVal) {
      const display = latestFormatterRef.current
        ? latestFormatterRef.current(endVal)
        : prefix + endVal.toLocaleString('en-IN', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }) + suffix
      el.textContent = display
      return
    }

    const start = performance.now()

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startVal + (endVal - startVal) * eased
      const display = latestFormatterRef.current
        ? latestFormatterRef.current(current)
        : prefix + current.toLocaleString('en-IN', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }) + suffix
      el!.textContent = display
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [value, duration, decimals, prefix, suffix])

  return <span ref={ref}>
    {prefix}
    {formatter ? formatter(value) : value.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    {suffix}
  </span>
}
