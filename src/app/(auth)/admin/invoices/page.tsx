import type { Metadata } from 'next'

import { AdminInvoiceList, AnimatedHeading } from '@/components/molecules'
import { CleanPageTemplate } from '@/components/templates'
import { BRAND_NAME } from '@/constants'

export const metadata: Metadata = {
  title: `Manage Invoices - ${BRAND_NAME}`,
}

const AdminInvoicesPage = () => (
  <CleanPageTemplate>
    <div className='container mx-auto px-4'>
      <div className='mb-12 text-center'>
        <AnimatedHeading
          text='INVOICES'
          level='h1'
          variant='section'
          className='mb-4'
        />
      </div>
      <AdminInvoiceList />
    </div>
  </CleanPageTemplate>
)

export default AdminInvoicesPage
