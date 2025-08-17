import { showCustomError, showCustomSuccess } from '@/components/atoms'

// eslint-disable-next-line react-hooks-extra/no-unnecessary-use-prefix
export const useToast = () => {
  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      showCustomSuccess(message)
    } else {
      showCustomError(message)
    }
  }

  const showSuccess = (message: string) => {
    showCustomSuccess(message)
  }

  const showError = (message: string) => {
    showCustomError(message)
  }

  return { showToast, showSuccess, showError }
}
