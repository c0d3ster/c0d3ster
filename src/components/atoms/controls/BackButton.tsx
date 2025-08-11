'use client'

import Link from 'next/link'
import { FaArrowLeft } from 'react-icons/fa'

type BackButtonProps = {
  href: string
  text?: string
}

export const BackButton = ({ href, text = 'BACK' }: BackButtonProps) => {
  return (
    <Link
      href={href}
      className='group fixed top-24 left-1/2 z-40 w-full max-w-7xl -translate-x-1/2 px-4'
    >
      <div className='flex items-center space-x-2 text-green-400 transition-all duration-300 hover:text-green-300'>
        <div className='transform transition-transform duration-300 group-hover:-translate-x-1'>
          <FaArrowLeft className='text-xl' />
        </div>
        <span className='font-mono font-bold whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
          {text}
        </span>
      </div>
    </Link>
  )
}
