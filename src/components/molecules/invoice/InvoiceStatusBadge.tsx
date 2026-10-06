import { InvoiceStatus } from '@/graphql/generated/graphql'

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus
}

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  [InvoiceStatus.Draft]: 'border-gray-400/40 bg-gray-400/20 text-gray-400',
  [InvoiceStatus.Sent]: 'border-blue-400/40 bg-blue-400/20 text-blue-400',
  [InvoiceStatus.Viewed]: 'border-blue-400/40 bg-blue-400/20 text-blue-400',
  [InvoiceStatus.PartiallyPaid]:
    'border-yellow-400/40 bg-yellow-400/20 text-yellow-400',
  [InvoiceStatus.Paid]: 'border-green-400/40 bg-green-400/20 text-green-400',
  [InvoiceStatus.Overdue]: 'border-red-400/40 bg-red-400/20 text-red-400',
  [InvoiceStatus.Cancelled]: 'border-gray-400/40 bg-gray-400/20 text-gray-400',
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.Draft]: 'draft',
  [InvoiceStatus.Sent]: 'sent',
  [InvoiceStatus.Viewed]: 'viewed',
  [InvoiceStatus.PartiallyPaid]: 'partially paid',
  [InvoiceStatus.Paid]: 'paid',
  [InvoiceStatus.Overdue]: 'overdue',
  [InvoiceStatus.Cancelled]: 'cancelled',
}

export const InvoiceStatusBadge = ({
  status,
}: InvoiceStatusBadgeProps): React.ReactElement => (
  <span
    className={`rounded border px-3 py-1 font-mono text-xs font-bold whitespace-nowrap uppercase ${STATUS_STYLES[status]}`}
  >
    {STATUS_LABELS[status]}
  </span>
)
