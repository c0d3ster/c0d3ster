import type { Metadata } from 'next'

import { AnimatedHeading, InvoiceList } from '@/components/molecules'
import { CleanPageTemplate } from '@/components/templates'
import { BRAND_NAME } from '@/constants'

export const metadata: Metadata = {
  title: `Invoices - ${BRAND_NAME}`,
}

const InvoicesPage = () => (
  <CleanPageTemplate>
    <div className='container mx-auto px-4'>
      <div className='mx-auto max-w-4xl'>
        <div className='mb-12 text-center'>
          <AnimatedHeading
            text='INVOICES'
            level='h1'
            variant='section'
            className='mb-4'
          />
        </div>

        <InvoiceList />
      </div>
    </div>
  </CleanPageTemplate>
)

export default InvoicesPage
