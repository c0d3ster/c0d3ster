'use client'

import type { ContactMethod } from './types'

type ContactMethodCardProps = {
  method: ContactMethod
}

export const ContactMethodCard = ({ method }: ContactMethodCardProps) => {
  return (
    <div className='group relative overflow-hidden rounded-lg border border-green-400/20 bg-black/80 p-4 text-center transition-all duration-300 hover:border-green-400/40 hover:bg-green-400/5'>
      <a
        href={method.link}
        target='_blank'
        rel='noopener noreferrer'
        className='h-full w-full'
      >
        <div className='mb-4 text-4xl'>{method.icon}</div>
        <h3 className='mb-2 font-mono text-lg font-bold text-green-400'>
          {method.title}
        </h3>
        <p className='font-mono text-sm text-green-300 opacity-80'>
          {method.value}
        </p>
        <div className='absolute bottom-4 left-4 opacity-20'>
          <div className='h-6 w-1 bg-green-400'></div>
        </div>
        <div className='absolute right-4 bottom-4 opacity-20'>
          <div className='h-6 w-1 bg-green-500'></div>
        </div>
      </a>
    </div>
  )
}
