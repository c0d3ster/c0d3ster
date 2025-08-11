'use client'

import Link from 'next/link'
import { FaArrowLeft } from 'react-icons/fa'

type BackButtonProps = {
  href: string
  className?: string
}

export const BackButton = ({ href, className = '' }: BackButtonProps) => {
  return (
    <Link
      href={href}
      className={`group fixed top-24 left-6 z-50 flex items-center gap-2 rounded-full border border-green-400/20 bg-black/80 px-3 py-2 text-green-400 transition-all duration-300 hover:border-green-400/40 hover:bg-green-400/20 ${className}`}
    >
      <FaArrowLeft className='h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1' />
      <span className='max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:max-w-32'>
        BACK TO PROJECTS
      </span>
    </Link>
  )
}
