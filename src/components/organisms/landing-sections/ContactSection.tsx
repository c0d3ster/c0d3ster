'use client'

import type { ContactMethod } from '@/components/molecules'

import {
  ExpandingUnderline,
  ScrollFade,
  SectionWrapper,
  TypewriterEffect,
} from '@/components/atoms'
import {
  AnimatedHeading,
  ContactForm,
  ContactMethodCard,
} from '@/components/molecules'

export const ContactSection = () => {
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
        <ContactForm />
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
