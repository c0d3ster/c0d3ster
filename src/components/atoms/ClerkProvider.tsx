'use client'

import type { ReactNode } from 'react'

import { frFR } from '@clerk/localizations'
import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs'

type ClerkProviderProps = {
  children: ReactNode
  locale?: string
}

export const ClerkProvider = ({
  children,
  locale = 'en',
}: ClerkProviderProps) => {
  const localization = locale === 'fr' ? frFR : undefined

  return (
    <BaseClerkProvider
      localization={localization}
      appearance={{
        baseTheme: undefined,
        elements: {
          // Main container styling
          card: '!bg-black/95 !border-2 !border-green-400/50 !rounded-lg !shadow-2xl !backdrop-blur-sm',
          headerTitle: '!text-green-400 !font-mono !font-semibold !text-xl',
          headerSubtitle: '!text-green-300 !font-mono !text-base',

          // Form elements - using !important to override Clerk defaults
          formButtonPrimary:
            '!rounded !border !font-mono !font-bold !transition-all !duration-300 !border-green-400 !bg-green-400/10 !text-green-400 hover:!bg-green-400 hover:!text-black !text-base !text-center !relative !overflow-hidden',
          formFieldInput:
            '!bg-black/80 !border-2 !border-green-400/60 !rounded-lg !px-4 !py-3 !text-green-100 !font-mono focus:!outline-none focus:!border-green-400 focus:!ring-2 focus:!ring-green-400/30 focus:!bg-black/90 !transition-all !duration-200 !placeholder-green-300/50',
          formFieldLabel:
            '!text-green-300 !font-mono !font-medium !text-sm !mb-2',
          formFieldInputShowPasswordButton:
            '!text-green-400 hover:!text-green-300 !transition-colors',

          // Social buttons - matching Button component styling with vertical lines
          socialButtonsBlockButton:
            '!inline-block !rounded !border !font-mono !font-bold !transition-all !duration-300 !border-green-400 !bg-green-400/10 !text-green-400 hover:!bg-green-400 hover:!text-black !px-6 !py-3 !text-base !text-center !relative !overflow-hidden',
          socialButtonsBlockButtonText: '!font-mono !font-bold',

          // Divider
          dividerLine: '!bg-green-400/50',
          dividerText: '!text-green-300 !font-mono !font-medium',

          // Footer
          footerActionText: '!text-green-300/90 !font-mono',
          footerActionLink:
            '!text-green-400 hover:!text-green-300 !font-mono !font-medium hover:!underline !transition-colors',

          // Identity preview
          identityPreviewText: '!text-green-300 !font-mono',
          identityPreviewEditButton:
            '!text-green-400 hover:!text-green-300 !transition-colors',

          // Form resend button
          formResendCodeLink:
            '!text-green-400 hover:!text-green-300 !font-mono !font-medium hover:!underline !transition-colors',

          // Alert styling
          alert:
            '!bg-green-400/15 !border-2 !border-green-400/40 !text-green-300 !font-mono !rounded-lg !p-4',
          alertText: '!text-green-300 !font-mono',

          // Modal styling
          modalBackdrop: '!bg-black/60 !backdrop-blur-sm',
          modalContent:
            '!bg-black/95 !border-2 !border-green-400/50 !rounded-lg !shadow-2xl',

          // Form field wrapper
          formField: '!space-y-3',

          // Error messages
          formFieldErrorText: '!text-red-400 !font-mono !text-sm',

          // Success messages
          formFieldSuccessText: '!text-green-400 !font-mono !text-sm',

          // Additional input styling to ensure visibility
          input:
            '!bg-black/80 !border-2 !border-green-400/60 !rounded-lg !px-4 !py-3 !text-green-100 !font-mono focus:!outline-none focus:!border-green-400 focus:!ring-2 focus:!ring-green-400/30 focus:!bg-black/90 !transition-all !duration-200',
        },
        variables: {
          colorPrimary: '#22c55e', // green-500
          colorText: '#f0fdf4', // green-50
          colorTextSecondary: '#bbf7d0', // green-200
          colorBackground: '#000000',
          colorInputBackground: '#000000',
          colorInputText: '#f0fdf4',
          borderRadius: '0.5rem',
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        },
      }}
    >
      {children}
    </BaseClerkProvider>
  )
}
