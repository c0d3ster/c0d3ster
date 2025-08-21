import type { Metadata } from 'next'

import { BackButton, ExpandingUnderline } from '@/components/atoms'
import { AnimatedHeading } from '@/components/molecules'
import { CleanPageTemplate } from '@/components/templates'

export const metadata: Metadata = {
  title: 'Privacy Policy - BALLZ',
  description: 'Privacy Policy for BALLZ mobile game',
}

export default function PrivacyPolicy() {
  return (
    <CleanPageTemplate>
      <BackButton href='/ballz' text='BACK TO PROJECTS' />
      <div className='container mx-auto px-4'>
        {/* Page Header */}
        <div className='mb-16 text-center'>
          <AnimatedHeading
            text='PRIVACY POLICY'
            level='h1'
            variant='section'
            className='mb-4'
          />
          <ExpandingUnderline />
          <p className='mt-6 font-mono text-lg text-green-300 opacity-80'>
            BALLZ Mobile Game
          </p>
          <p className='mt-4 font-mono text-base text-green-400 opacity-70'>
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Privacy Policy Content */}
        <div className='mx-auto max-w-4xl space-y-8'>
          <div className='rounded border border-green-400/20 bg-black/40 p-8'>
            <h2 className='mb-6 font-mono text-2xl font-bold text-green-400'>
              INTRODUCTION
            </h2>
            <p className='mb-4 font-mono leading-relaxed text-green-300 opacity-90'>
              This Privacy Policy describes how BALLZ ("we," "our," or "us")
              collects, uses, and protects your information when you use our
              mobile game application.
            </p>
            <p className='font-mono leading-relaxed text-green-300 opacity-90'>
              By using BALLZ, you agree to the collection and use of information
              in accordance with this policy.
            </p>
          </div>

          <div className='rounded border border-green-400/20 bg-black/40 p-8'>
            <h2 className='mb-6 font-mono text-2xl font-bold text-green-400'>
              INFORMATION WE COLLECT
            </h2>
            <div className='space-y-4'>
              <div>
                <h3 className='mb-3 font-mono font-bold text-green-400'>
                  Personal Information
                </h3>
                <p className='font-mono text-sm text-green-300 opacity-80'>
                  We collect only the minimal information necessary for game
                  functionality:
                </p>
                <ul className='mt-2 ml-6 space-y-1 font-mono text-sm text-green-300 opacity-80'>
                  <li>
                    • Email address (for account creation and password recovery)
                  </li>
                  <li>
                    • Username (for in-game identification and multiplayer
                    features)
                  </li>
                </ul>
              </div>
              <div>
                <h3 className='mb-3 font-mono font-bold text-green-400'>
                  Game Data
                </h3>
                <p className='font-mono text-sm text-green-300 opacity-80'>
                  We may collect anonymous gameplay statistics and performance
                  metrics to improve game experience and fix technical issues.
                </p>
              </div>
            </div>
          </div>

          <div className='rounded border border-green-400/20 bg-black/40 p-8'>
            <h2 className='mb-6 font-mono text-2xl font-bold text-green-400'>
              HOW WE USE YOUR INFORMATION
            </h2>
            <div className='space-y-4'>
              <p className='font-mono text-sm text-green-300 opacity-80'>
                We use the collected information for:
              </p>
              <ul className='ml-6 space-y-1 font-mono text-sm text-green-300 opacity-80'>
                <li>• Creating and managing your game account</li>
                <li>
                  • Providing multiplayer functionality and social features
                </li>
                <li>• Sending important game updates and notifications</li>
                <li>• Improving game performance and user experience</li>
                <li>• Providing customer support when needed</li>
              </ul>
            </div>
          </div>

          <div className='rounded border border-green-400/20 bg-black/40 p-8'>
            <h2 className='mb-6 font-mono text-2xl font-bold text-green-400'>
              DATA SECURITY
            </h2>
            <p className='mb-4 font-mono leading-relaxed text-green-300 opacity-90'>
              We implement appropriate security measures to protect your
              personal information against unauthorized access, alteration,
              disclosure, or destruction.
            </p>
            <p className='font-mono leading-relaxed text-green-300 opacity-90'>
              Your data is encrypted during transmission and stored securely on
              our servers.
            </p>
          </div>

          <div className='rounded border border-green-400/20 bg-black/40 p-8'>
            <h2 className='mb-6 font-mono text-2xl font-bold text-green-400'>
              DATA SHARING
            </h2>
            <p className='mb-4 font-mono leading-relaxed text-green-300 opacity-90'>
              We do not sell, trade, or otherwise transfer your personal
              information to third parties, except as described below:
            </p>
            <ul className='ml-6 space-y-1 font-mono text-sm text-green-300 opacity-80'>
              <li>
                • Service providers who assist in game operations (hosting,
                analytics)
              </li>
              <li>• Legal requirements or to protect our rights and safety</li>
              <li>• With your explicit consent</li>
            </ul>
          </div>

          <div className='rounded border border-green-400/20 bg-black/40 p-8'>
            <h2 className='mb-6 font-mono text-2xl font-bold text-green-400'>
              YOUR RIGHTS
            </h2>
            <p className='mb-4 font-mono leading-relaxed text-green-300 opacity-90'>
              You have the right to:
            </p>
            <ul className='ml-6 space-y-1 font-mono text-sm text-green-300 opacity-80'>
              <li>• Access your personal information</li>
              <li>• Update or correct your information</li>
              <li>• Request deletion of your account and data</li>
              <li>• Opt-out of non-essential communications</li>
            </ul>
          </div>

          <div className='rounded border border-green-400/20 bg-black/40 p-8'>
            <h2 className='mb-6 font-mono text-2xl font-bold text-green-400'>
              CHILDREN'S PRIVACY
            </h2>
            <p className='mb-4 font-mono leading-relaxed text-green-300 opacity-90'>
              BALLZ is not intended for children under 13 years of age. We do
              not knowingly collect personal information from children under 13.
            </p>
            <p className='font-mono leading-relaxed text-green-300 opacity-90'>
              If you are a parent or guardian and believe your child has
              provided us with personal information, please contact us
              immediately.
            </p>
          </div>

          <div className='rounded border border-green-400/20 bg-black/40 p-8'>
            <h2 className='mb-6 font-mono text-2xl font-bold text-green-400'>
              CHANGES TO THIS POLICY
            </h2>
            <p className='mb-4 font-mono leading-relaxed text-green-300 opacity-90'>
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new Privacy Policy on
              this page and updating the "Last updated" date.
            </p>
            <p className='font-mono leading-relaxed text-green-300 opacity-90'>
              Your continued use of BALLZ after any changes constitutes
              acceptance of the updated policy.
            </p>
          </div>

          <div className='rounded border border-green-400/20 bg-black/40 p-8'>
            <h2 className='mb-6 font-mono text-2xl font-bold text-green-400'>
              CONTACT US
            </h2>
            <p className='mb-4 font-mono leading-relaxed text-green-300 opacity-90'>
              If you have any questions about this Privacy Policy or our data
              practices, please contact us at:
            </p>
            <div className='font-mono text-sm text-green-300 opacity-80'>
              <p>Email: support@c0d3ster.com</p>
              <p>GitHub: github.com/c0d3ster</p>
            </div>
          </div>
        </div>
      </div>
    </CleanPageTemplate>
  )
}
