import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { ClientProviders } from '@/providers'
import '@/styles/global.css'

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang='en'>
    <body>
      <ClientProviders>
        {children}
      </ClientProviders>
      <Analytics />
      <SpeedInsights />
    </body>
  </html>
)

export default RootLayout
