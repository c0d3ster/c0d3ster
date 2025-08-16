'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import type { ContactMethod } from '@/components/molecules'
import type { ContactFormData } from '@/validations'

import {
  ExpandingUnderline,
  ScrollFade,
  SectionWrapper,
  TypewriterEffect,
} from '@/components/atoms'
import { AnimatedHeading, ContactMethodCard } from '@/components/molecules'
import { contactFormSchema } from '@/validations'

export const ContactSection = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')
  const [submitMessage, setSubmitMessage] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setSubmitMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setSubmitMessage(
          "Message sent successfully! I'll get back to you within 24 hours."
        )
        reset()
      } else {
        const errorData = await response.json()
        setSubmitStatus('error')
        setSubmitMessage(
          errorData.error || 'Failed to send message. Please try again.'
        )
      }
    } catch {
      setSubmitStatus('error')
      setSubmitMessage(
        'Network error. Please check your connection and try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactMethods: ContactMethod[] = [
    {
      title: 'EMAIL',
      value: 'support@c0d3ster.com',
      icon: '📧',
      link: 'mailto:support@c0d3ster.com',
    },
    {
      title: 'GITHUB',
      value: 'github.com/c0d3ster',
      icon: '💻',
      link: 'https://github.com/c0d3ster',
    },
    {
      title: 'LINKEDIN',
      value: 'linkedin.com/in/cody-douglass',
      icon: '🔗',
      link: 'https://linkedin.com/in/cody-douglass',
    },
  ]

  return (
    <SectionWrapper id='contact'>
      {/* Section Header */}
      <ScrollFade>
        <div className='mt-12 mb-16 text-center'>
          <AnimatedHeading
            text='CONTACT'
            level='h2'
            variant='section'
            className='mb-4'
          />
          <ExpandingUnderline />
          <p className='mt-6 font-mono text-lg text-green-300 opacity-80'>
            READY TO START YOUR PROJECT?
          </p>
        </div>
      </ScrollFade>

      {/* Contact Methods */}
      <div className='mb-12 grid gap-16 md:grid-cols-3'>
        {contactMethods.map((method) => (
          <ScrollFade key={method.title}>
            <ContactMethodCard method={method} />
          </ScrollFade>
        ))}
      </div>

      {/* Contact Form */}
      <div className='relative z-20 mx-auto mt-8 max-w-2xl'>
        <div className='rounded-lg border border-green-400/20 bg-black/80 p-4'>
          <h3 className='mb-6 text-center font-mono text-2xl font-bold text-green-400'>
            SEND MESSAGE
          </h3>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className='mb-6 rounded border border-green-400/30 bg-green-400/10 p-4 text-center'>
              <p className='font-mono text-green-400'>{submitMessage}</p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className='mb-6 rounded border border-red-400/30 bg-red-400/10 p-4 text-center'>
              <p className='font-mono text-red-400'>{submitMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
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
                {errors.name && (
                  <p className='mt-1 text-sm text-red-400'>
                    {errors.name.message}
                  </p>
                )}
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
                {errors.email && (
                  <p className='mt-1 text-sm text-red-400'>
                    {errors.email.message}
                  </p>
                )}
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
              {errors.subject && (
                <p className='mt-1 text-sm text-red-400'>
                  {errors.subject.message}
                </p>
              )}
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
              {errors.message && (
                <p className='mt-1 text-sm text-red-400'>
                  {errors.message.message}
                </p>
              )}
            </div>

            <div className='text-center'>
              <button
                type='submit'
                disabled={isSubmitting}
                className='rounded border border-green-400 bg-green-400/10 px-8 py-3 font-mono font-bold text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isSubmitting ? 'SENDING...' : 'INITIATE TRANSMISSION'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Additional Matrix-style info */}
      <div className='mt-16 text-center font-mono text-sm text-green-600 opacity-40'>
        <p>
          <TypewriterEffect text='RESPONSE TIME: < 24 HOURS' speed={65} />
        </p>
        <p>
          <TypewriterEffect text='AVAILABILITY: OPEN FOR PROJECTS' speed={65} />
        </p>
        <p>
          <TypewriterEffect
            text='COMMUNICATION: SECURE & CONFIDENTIAL'
            speed={65}
          />
        </p>
      </div>
    </SectionWrapper>
  )
}
