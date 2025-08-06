'use client'

import { useEffect, useState } from 'react'

export const MatrixHero = () => {
  const [displayText, setDisplayText] = useState('')
  const targetText = 'c0d3ster'
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < targetText.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + targetText[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, 200)

      return () => clearTimeout(timer)
    }
    return () => {}
  }, [currentIndex])

  return (
    <div id="home" className="relative flex min-h-screen items-center justify-center">
      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Main text */}
        <h1 className="mb-8 font-mono text-8xl font-bold tracking-wider text-green-400 md:text-9xl">
          {displayText}
          <span className="animate-pulse">_</span>
        </h1>

        {/* Subtitle */}
        <div className="mt-8 space-y-4">
          <p className="font-mono text-xl text-green-300 md:text-2xl">
            SOFTWARE CONTRACTOR
          </p>
          <p className="font-mono text-lg text-green-400 opacity-80 md:text-xl">
            FULL-STACK DEVELOPMENT
          </p>
          <p className="font-mono text-base text-green-500 opacity-60 md:text-lg">
            REACT • NEXT.JS • TYPESCRIPT • NODE.JS
          </p>
        </div>

        {/* Matrix-style decorative elements */}
        <div className="mt-12 flex justify-center space-x-8">
          <div className="h-16 w-1 bg-green-400" />
          <div className="h-16 w-1 bg-green-500" />
          <div className="h-16 w-1 bg-green-300" />
        </div>

        {/* Additional Matrix-style info */}
        <div className="mt-16 font-mono text-sm text-green-600 opacity-40">
          <p>SYSTEM STATUS: ONLINE</p>
          <p>CONNECTION: SECURE</p>
          <p>READY FOR DEPLOYMENT</p>
        </div>
      </div>
    </div>
  )
}
