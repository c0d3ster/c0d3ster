'use client'

import { useEffect, useRef, useState } from 'react'

type TypewriterEffectProps = {
  text: string
  speed?: number
  className?: string
  showCursor?: boolean
  keepCursor?: boolean
}

export const TypewriterEffect = ({
  text,
  speed = 100,
  className = '',
  showCursor = true,
  keepCursor = false,
}: TypewriterEffectProps) => {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [isInViewport, setIsInViewport] = useState(false)
  const elementRef = useRef<HTMLSpanElement>(null)
  const setIsCompleteRef = useRef(setIsComplete)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setIsInViewport(true)
        }
      },
      { threshold: 0.1 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isInViewport) return

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, speed)

      return () => clearTimeout(timer)
    } else {
      setIsCompleteRef.current(true)
    }
    return () => {}
  }, [currentIndex, text, speed, isInViewport])

  const shouldShowCursor = showCursor && (keepCursor || !isComplete)

  return (
    <span ref={elementRef} className={className}>
      {displayText}
      {shouldShowCursor && <span className='animate-pulse'>_</span>}
    </span>
  )
}
