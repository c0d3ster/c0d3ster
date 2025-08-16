import {
  showCustomError,
  showCustomSuccess,
} from '@/components/atoms/feedback/CustomToast'

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
