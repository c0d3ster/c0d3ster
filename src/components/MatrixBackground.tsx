'use client'

import { useEffect, useRef } from 'react'

export const MatrixBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mousePositionRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY }
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Matrix setup
    const chars = ['c', '0', 'd', '3']
    const fontSize = 16
    const columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = []
    const charIndexes: number[] = []
    const charsPerColumn = 3 // Multiple characters per column

    // Initialize drops with more randomization
    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < charsPerColumn; j++) {
        const index = i * charsPerColumn + j
        drops[index] = Math.random() * -200 - 60 + (j * 30) // Start further above screen
        charIndexes[index] = Math.floor(Math.random() * chars.length)
      }
    }

    const draw = () => {
      // Faster fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw characters
      ctx.fillStyle = '#00ff00'
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i]
        if (drop !== undefined) {
          const charIndex = charIndexes[i]
          if (charIndex !== undefined) {
            const char = chars[charIndex]
            if (char) {
              // Calculate distance from mouse to character
              const columnIndex = Math.floor(i / charsPerColumn)
              const charX = columnIndex * fontSize
              const charY = drop * fontSize
              const distance = Math.sqrt(
                (charX - mousePositionRef.current.x) ** 2 + (charY - mousePositionRef.current.y) ** 2,
              )

              // Set opacity based on distance (0.2 base, 1.0 when close)
              const maxDistance = 300 // Much larger distance for full opacity
              const opacity = Math.max(0.2, 1 - distance / maxDistance)

              ctx.fillStyle = `rgba(0, 255, 0, ${opacity})`
              ctx.fillText(char, charX, charY)

              drops[i] = drop + 1

              // Cycle through the c0d3 sequence
              charIndexes[i] = (charIndex + 1) % chars.length

              // Reset to top with more randomization
              if (drop * fontSize > canvas.height) {
                drops[i] = Math.random() * -200 - 60 + (Math.floor(i % charsPerColumn) * 30)
                charIndexes[i] = Math.floor(Math.random() * chars.length)
              }
            }
          }
        }
      }
    }

    const interval = setInterval(draw, 100)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{
        background: 'black',
        width: '100vw',
        height: '100vh',
      }}
    />
  )
}
