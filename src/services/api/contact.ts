export const submitContactForm = async (formData: {
  name: string
  email: string
  subject: string
  message: string
}) => {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to submit contact form')
  }

  return response.json()
}
