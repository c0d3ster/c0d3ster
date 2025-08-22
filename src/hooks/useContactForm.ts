import { useMutation } from '@tanstack/react-query'

import { logger } from '@/libs/Logger'
import { submitContactForm } from '@/services/api'

export const useContactForm = () => {
  const mutation = useMutation({
    mutationFn: submitContactForm,
    onSuccess: () => {
      // You could add success handling here, like showing a toast
      logger.info('Contact form submitted successfully')
    },
    onError: (error) => {
      // You could add error handling here, like showing an error toast
      logger.error(`Contact form submission failed: ${error}`)
    },
  })

  return {
    submitForm: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  }
}
