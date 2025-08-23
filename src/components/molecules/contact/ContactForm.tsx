'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import type { ContactFormData } from '@/validations'

import { Button } from '@/components/atoms'
import { Toast } from '@/libs/Toast'
import { contactFormSchema } from '@/validations'

// Contact form component for handling user submissions
export const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onSubmit',
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        Toast.success(
          "Message sent successfully! I'll get back to you within 24 hours."
        )
        reset()
      } else {
        const errorData = await response.json()
        Toast.error(
          errorData.error || 'Failed to send message. Please try again.'
        )
      }
    } catch {
      Toast.error('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onError = (errors: any) => {
    const errorMessages = Object.values(errors)
      .map((err: any) => err.message)
      .join(', ')
    Toast.error(`Please fix the following errors: ${errorMessages}`)
  }

  return (
    <div className='relative z-20 mx-auto mt-8 max-w-2xl'>
      <div className='rounded-lg border border-green-400/20 bg-black/80 p-4'>
        <h3 className='mb-6 text-center font-mono text-2xl font-bold text-green-400'>
          SEND MESSAGE
        </h3>

        <form
          onSubmit={handleSubmit(onSubmit, onError)}
          className='space-y-6'
          noValidate
        >
          <div className='grid gap-6 md:grid-cols-2'>
            <div>
              <label
                htmlFor='name'
                className='mb-2 block font-mono text-sm text-green-300'
              >
                NAME
              </label>
              <input
                {...register('name')}
                id='name'
                type='text'
                className='w-full rounded border border-green-400/30 bg-black/50 p-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:outline-none'
                placeholder='YOUR NAME'
              />
            </div>
            <div>
              <label
                htmlFor='email'
                className='mb-2 block font-mono text-sm text-green-300'
              >
                EMAIL
              </label>
              <input
                {...register('email')}
                id='email'
                type='email'
                className='w-full rounded border border-green-400/30 bg-black/50 p-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:outline-none'
                placeholder='YOUR EMAIL'
              />
            </div>
          </div>

          <div>
            <label
              htmlFor='subject'
              className='mb-2 block font-mono text-sm text-green-300'
            >
              SUBJECT
            </label>
            <input
              {...register('subject')}
              id='subject'
              type='text'
              className='w-full rounded border border-green-400/30 bg-black/50 p-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:outline-none'
              placeholder='PROJECT TYPE'
            />
          </div>

          <div>
            <label
              htmlFor='message'
              className='mb-2 block font-mono text-sm text-green-300'
            >
              MESSAGE
            </label>
            <textarea
              {...register('message')}
              id='message'
              rows={4}
              className='w-full resize-none rounded border border-green-400/30 bg-black/50 p-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:outline-none'
              placeholder='DESCRIBE YOUR PROJECT...'
            />
          </div>

          <div className='text-center'>
            <Button type='submit' size='md' disabled={isSubmitting}>
              {isSubmitting ? 'SENDING...' : 'INITIATE TRANSMISSION'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
