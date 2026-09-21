'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FaTimes } from 'react-icons/fa'

type ModalProps = {
  title: string
  onClose: () => void
  children: React.ReactNode
  maxWidthClassName?: string
}

export const Modal = ({
  title,
  onClose,
  children,
  maxWidthClassName = 'max-w-md',
}: ModalProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div
        aria-hidden='true'
        data-testid='modal-backdrop'
        onClick={onClose}
        className='absolute inset-0 bg-black/80'
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-label={title}
        className={`relative w-full ${maxWidthClassName} rounded-lg border border-green-400/30 bg-black p-4`}
      >
        <div className='mb-3 flex items-center justify-between'>
          <p className='truncate font-mono text-sm font-bold text-green-400'>
            {title}
          </p>
          <button
            type='button'
            onClick={onClose}
            className='shrink-0 text-green-400/60 hover:text-green-400'
            title='Close'
            aria-label='Close'
          >
            <FaTimes className='h-4 w-4' />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}
