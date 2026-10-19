'use client'

import { usePathname } from 'next/navigation'

import { useGetInvoice } from '@/apiClients/invoiceApiClient'
import { ExpandingUnderline } from '@/components/atoms'

import { AnimatedHeading } from '../animated-text/AnimatedHeading'

const BASE_PATH = '/dashboard/invoices'

type HeaderCopy = { title: string; description: string }

const LIST_COPY: HeaderCopy = {
  title: 'INVOICES',
  description:
    'Review what you have been billed and pay securely, or manage invoices sent to clients.',
}

const NEW_COPY: HeaderCopy = {
  title: 'NEW INVOICE',
  description:
    'Pick a project, review the line items, and save it as a draft before sending.',
}

// Extracts the invoice id from /dashboard/invoices/[id] and /dashboard/invoices/[id]/edit
const getInvoiceId = (pathname: string): string | undefined => {
  const [segment] = pathname.slice(BASE_PATH.length).split('/').filter(Boolean)
  return segment && segment !== 'new' ? segment : undefined
}

export const InvoicesHeader = (): React.ReactElement => {
  const pathname = usePathname()
  const invoiceId = getInvoiceId(pathname)
  // Same query the detail view makes; Apollo dedupes the in-flight request
  const { data } = useGetInvoice(invoiceId ?? '', !invoiceId)

  const copy: HeaderCopy = invoiceId
    ? {
        title: data?.getInvoice?.invoiceNumber ?? 'INVOICE',
        description: 'Line items, totals, and payment status for this invoice.',
      }
    : pathname === `${BASE_PATH}/new`
      ? NEW_COPY
      : LIST_COPY

  return (
    <div className='mb-8 text-center'>
      <AnimatedHeading
        text={copy.title}
        level='h1'
        variant='section'
        className='mb-4'
      />
      <ExpandingUnderline />

      <p className='mt-6 font-mono text-base text-green-300/80'>
        {copy.description}
      </p>
    </div>
  )
}
