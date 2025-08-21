'use client'

import { ScrollFade, TypewriterEffect } from '@/components/atoms'

type AnimatedHeadingProps = {
  text: string
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  variant?: 'hero' | 'section' | 'subtitle'
  withTypewriter?: boolean
  typewriterSpeed?: number
  keepCursor?: boolean
  className?: string
}

const variantStyles = {
  hero: 'font-mono text-5xl md:text-8xl lg:text-9xl font-bold tracking-wider text-green-400',
  section: 'font-mono text-4xl font-bold text-green-400 md:text-6xl',
  subtitle: 'font-mono text-lg text-green-300 sm:text-xl md:text-2xl',
}

export const AnimatedHeading = ({
  text,
  level = 'h1',
  variant = 'section',
  withTypewriter = false,
  typewriterSpeed = 200,
  keepCursor = false,
  className = '',
}: AnimatedHeadingProps) => {
  const Component = level
  const baseClassName = `${variantStyles[variant]} ${className}`

  const content = withTypewriter ? (
    <TypewriterEffect
      text={text}
      speed={typewriterSpeed}
      keepCursor={keepCursor}
      className={baseClassName}
    />
  ) : (
    <Component className={baseClassName}>{text}</Component>
  )

  return <ScrollFade>{content}</ScrollFade>
}
