import type { Metadata } from 'next'

import { AnimatedHeading, CreateInvoiceForm } from '@/components/molecules'
import { CleanPageTemplate } from '@/components/templates'
import { BRAND_NAME } from '@/constants'

export const metadata: Metadata = {
  title: `New Invoice - ${BRAND_NAME}`,
}

const NewInvoicePage = () => (
  <CleanPageTemplate>
    <div className='container mx-auto px-4'>
      <div className='mb-12 text-center'>
        <AnimatedHeading
          text='NEW INVOICE'
          level='h1'
          variant='section'
          className='mb-4'
        />
      </div>
      <CreateInvoiceForm />
    </div>
  </CleanPageTemplate>
)

export default NewInvoicePage
