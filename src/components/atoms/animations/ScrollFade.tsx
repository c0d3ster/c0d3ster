'use client'

import { useEffect, useRef, useState } from 'react'

type ScrollFadeProps = {
  children: React.ReactNode
  className?: string
}

export const ScrollFade = ({ children, className = '' }: ScrollFadeProps) => {
  const [scrollY, setScrollY] = useState(0)
  const [elementTop, setElementTop] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const setScrollYRef = useRef(setScrollY)
  const setElementTopRef = useRef(setElementTop)
  const setIsClientRef = useRef(setIsClient)

  useEffect(() => {
    setIsClientRef.current(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrollYRef.current(window.scrollY)
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect()
        setElementTopRef.current(rect.top + window.scrollY)
      }
    }

    handleScroll() // Initial position
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate animation based on element position relative to viewport
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0
  const elementPosition = elementTop - scrollY

  // Animation zones:
  // - Bottom 15%: Fade in (opacity 0.33 to 1)
  // - Center 70%: Full opacity (opacity 1)
  // - Top 15%: Fade out (opacity 1 to 0)

  const bottom15 = viewportHeight * 0.85 // Start of bottom 15%
  const center = viewportHeight * 0.5 // Center of viewport
  const top15 = viewportHeight * 0.15 // Start of top 15%

  let opacity = 1

  // If element is already in the stable center zone when component mounts, keep it at full opacity
  const isInStableZone = elementPosition <= center && elementPosition >= top15

  if (elementPosition > viewportHeight) {
    // Below viewport: invisible
    opacity = 0
  } else if (elementPosition > bottom15) {
    // Bottom zone: linear fade from 0 at viewport bottom to 1 at bottom15
    const linearProgress =
      (viewportHeight - elementPosition) / (viewportHeight - bottom15)
    opacity = linearProgress // 0 to 1 linearly
  } else if (elementPosition > top15) {
    // Center 70%: stay full opacity
    opacity = 1
  } else if (elementPosition > 0) {
    // Top zone: linear fade from 1 at top15 to 0 at viewport top
    const linearProgress = elementPosition / top15
    opacity = linearProgress // 1 to 0 linearly
  } else {
    // Above viewport: invisible
    opacity = 0
  }

  // If element is already in stable zone, ensure it starts at full opacity
  if (isInStableZone && elementTop === 0) {
    opacity = 1
  }

  return (
    <div
      ref={elementRef}
      className={`transition-all duration-300 ${className}`}
      style={{
        opacity: isClient ? opacity : 1,
        transform: `translateY(0px)`,
      }}
    >
      {children}
    </div>
  )
}
