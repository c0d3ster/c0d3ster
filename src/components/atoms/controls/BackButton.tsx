'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaArrowLeft } from 'react-icons/fa'

type BackButtonProps = {
  href?: string
  text?: string
  useBack?: boolean
}

export const BackButton = ({
  href,
  text = 'BACK',
  useBack = false,
}: BackButtonProps) => {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    if (useBack) {
      e.preventDefault()
      router.back()
    }
  }

  return (
    <div className='fixed top-24 right-0 left-0 z-40'>
      <div className='container mx-auto px-4'>
        <Link
          href={useBack ? '#' : href || '/'}
          onClick={handleClick}
          className='group inline-flex items-center space-x-2 text-green-400 transition-all duration-300 hover:text-green-300'
        >
          <div className='transform transition-transform duration-300 group-hover:-translate-x-1'>
            <FaArrowLeft className='text-xl' />
          </div>
          <span className='font-mono font-bold whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
            {text}
          </span>
        </Link>
      </div>
    </div>
  )
}
