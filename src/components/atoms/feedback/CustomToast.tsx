'use client'

import { toast } from 'react-toastify'

export const showCustomSuccess = (message: string) => {
  toast(message, {
    type: 'success',
    className:
      '!bg-black/90 !border !border-green-400/30 !rounded-lg !text-green-400 !font-mono !shadow-lg',
    progressClassName: '!bg-green-400',
    icon: false,
  })
}

export const showCustomError = (message: string) => {
  toast(message, {
    type: 'error',
    className:
      '!bg-black/90 !border !border-red-400/30 !rounded-lg !text-red-400 !font-mono !shadow-lg',
    progressClassName: '!bg-red-400',
    icon: false,
  })
}
