import type { ReactNode } from 'react'

import { InvoicesHeader } from '@/components/molecules'
import { CleanPageTemplate } from '@/components/templates'

const InvoicesLayout = ({ children }: { children: ReactNode }) => (
  <CleanPageTemplate>
    <div className='container mx-auto px-4'>
      <div className='mx-auto max-w-5xl'>
        {/* Header Section - title follows the current invoices route */}
        <InvoicesHeader />

        {children}
      </div>
    </div>
  </CleanPageTemplate>
)

export default InvoicesLayout
