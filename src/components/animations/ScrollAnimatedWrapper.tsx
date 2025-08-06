'use client'

import { useEffect, useRef, useState } from 'react'

type ScrollAnimatedWrapperProps = {
  children: React.ReactNode
  className?: string
}

export const ScrollAnimatedWrapper = ({ 
  children, 
  className = ''
}: ScrollAnimatedWrapperProps) => {
  const [scrollY, setScrollY] = useState(0)
  const [elementTop, setElementTop] = useState(0)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect()
        setElementTop(rect.top + window.scrollY)
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
  // - Bottom 15%: Fade in (opacity 0 to 1)
  // - Center 70%: Full opacity (opacity 1) 
  // - Top 15%: Fade out (opacity 1 to 0)
  
  const bottom15 = viewportHeight * 0.85 // Start of bottom 15%
  const center = viewportHeight * 0.5 // Center of viewport
  const top15 = viewportHeight * 0.15 // Start of top 15%
  
  let opacity = 1
  
  // If element is already in the stable center zone when component mounts, keep it at full opacity
  const isInStableZone = elementPosition <= center && elementPosition >= top15
  
  if (elementPosition > bottom15) {
    // Bottom 15%: fade in
    const bottomProgress = Math.max(0, Math.min(1, (elementPosition - bottom15) / (center - bottom15)))
    opacity = bottomProgress // 0 to 1
  } else if (elementPosition > top15) {
    // Center 70%: stay full opacity
    opacity = 1
  } else {
    // Top 15%: fade out
    const topProgress = Math.max(0, Math.min(1, (top15 - elementPosition) / (top15 - 0)))
    opacity = 1 - topProgress // 1 to 0
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
        opacity,
        transform: `translateY(0px)`,
      }}
    >
      {children}
    </div>
  )
} 