import type { Metadata } from 'next'

import { PostHogProvider } from '@/analytics'
import { ToastContainer } from '@/components/atoms'
import { ClerkProvider, QueryProvider } from '@/providers'
import '@/styles/global.css'

export const metadata: Metadata = {
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/favicon-16x16.png',
    },
    {
      rel: 'icon',
      url: '/favicon.ico',
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <body>
        <ClerkProvider>
          <PostHogProvider>
            <QueryProvider>
              {children}
              <ToastContainer />
            </QueryProvider>
          </PostHogProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
