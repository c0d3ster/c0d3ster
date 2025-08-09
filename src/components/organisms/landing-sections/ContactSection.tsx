'use client'

import {
  ExpandingUnderline,
  ScrollFade,
  SectionWrapper,
  TypewriterEffect,
} from '@/components/atoms'
import { AnimatedHeading } from '@/components/molecules'

export const ContactSection = () => {
  const contactMethods = [
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
      value: 'linkedin.com/in/cody-douglas',
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
          <ScrollFade
            key={method.title}
            className='group relative overflow-hidden rounded-lg border border-green-400/20 bg-black/80 p-4 text-center transition-all duration-300 hover:border-green-400/40 hover:bg-green-400/5'
          >
            <a
              href={method.link}
              target='_blank'
              rel='noopener noreferrer'
              className='h-full w-full'
            >
              {/* Icon */}
              <div className='mb-4 text-4xl'>{method.icon}</div>

              {/* Title */}
              <h3 className='mb-2 font-mono text-lg font-bold text-green-400'>
                {method.title}
              </h3>

              {/* Value */}
              <p className='font-mono text-sm text-green-300 opacity-80'>
                {method.value}
              </p>

              {/* Matrix-style decorative elements */}
              <div className='absolute bottom-4 left-4 opacity-20'>
                <div className='h-6 w-1 bg-green-400' />
              </div>
              <div className='absolute right-4 bottom-4 opacity-20'>
                <div className='h-6 w-1 bg-green-500' />
              </div>
            </a>
          </ScrollFade>
        ))}
      </div>

      {/* Contact Form */}
      <div className='relative z-20 mx-auto mt-8 max-w-2xl'>
        <div className='rounded-lg border border-green-400/20 bg-black/80 p-4'>
          <h3 className='mb-6 text-center font-mono text-2xl font-bold text-green-400'>
            SEND MESSAGE
          </h3>

          <form className='space-y-6'>
            <div className='grid gap-6 md:grid-cols-2'>
              <div>
                <label
                  htmlFor='name'
                  className='mb-2 block font-mono text-sm text-green-300'
                >
                  NAME
                </label>
                <input
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
                id='message'
                rows={4}
                className='w-full resize-none rounded border border-green-400/30 bg-black/50 p-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:outline-none'
                placeholder='DESCRIBE YOUR PROJECT...'
              />
            </div>

            <div className='text-center'>
              <button
                type='submit'
                className='rounded border border-green-400 bg-green-400/10 px-8 py-3 font-mono font-bold text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black'
              >
                SEND MESSAGE
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
