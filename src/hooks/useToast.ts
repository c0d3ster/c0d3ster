import { toast } from 'react-toastify'

export const useToast = () => {
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning'
  ) => {
    switch (type) {
      case 'success':
        toast.success(message)
        break
      case 'error':
        toast.error(message)
        break
      case 'info':
        toast.info(message)
        break
      case 'warning':
        toast.warn(message)
        break
    }
  }

  return { showToast }
}
