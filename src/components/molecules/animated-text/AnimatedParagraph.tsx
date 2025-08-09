'use client'

import { ScrollFade } from '@/components/atoms'

type AnimatedParagraphProps = {
  children: React.ReactNode
  variant?: 'default' | 'large' | 'small'
  className?: string
}

const variantStyles = {
  default:
    'font-mono text-base text-green-400 opacity-80 sm:text-lg md:text-xl',
  large: 'font-mono text-lg text-green-300 sm:text-xl md:text-2xl',
  small: 'font-mono text-sm text-green-500 opacity-60 sm:text-base md:text-lg',
}

export const AnimatedParagraph = ({
  children,
  variant = 'default',
  className = '',
}: AnimatedParagraphProps) => {
  return (
    <ScrollFade>
      <p className={`${variantStyles[variant]} ${className}`}>{children}</p>
    </ScrollFade>
  )
}
