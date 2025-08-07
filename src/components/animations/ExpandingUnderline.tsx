'use client'

import { useEffect, useRef, useState } from 'react'

type ExpandingUnderlineProps = {
  className?: string
  maxWidth?: number
  maxScroll?: number
}

export const ExpandingUnderline = ({ 
  className = '', 
  maxWidth = 160, // w-40 = 160px
  maxScroll 
}: ExpandingUnderlineProps) => {
  const [expansionProgress, setExpansionProgress] = useState(0)
  const elementRef = useRef<HTMLDivElement>(null)
  const setExpansionProgressRef = useRef(setExpansionProgress)

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return

      const rect = elementRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      
      // Calculate expansion based on position in viewport (2/3 of viewport by default)
      const defaultMaxScroll = (viewportHeight * 2) / 3
      const scrollDistance = maxScroll || defaultMaxScroll
      const currentScroll = viewportHeight - rect.top
      const progress = Math.max(0, Math.min(1, currentScroll / scrollDistance))
      
      setExpansionProgressRef.current(progress)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [maxScroll])

  const underlineWidth = expansionProgress * maxWidth

  return (
    <div 
      ref={elementRef}
      className={`relative mx-auto h-1 animate-pulse bg-green-400 transition-all duration-300 ease-out ${className}`}
      style={{ width: `${underlineWidth}px` }}
    />
  )
} 