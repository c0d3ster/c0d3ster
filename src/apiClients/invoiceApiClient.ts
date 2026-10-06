import { useMutation, useQuery } from '@apollo/client/react'
import { gql } from 'graphql-tag'

import type {
  GetInvoiceQuery,
  GetInvoiceQueryVariables,
  GetMyInvoicesQuery,
  MarkInvoiceViewedMutation,
  MarkInvoiceViewedMutationVariables,
} from '@/graphql/generated/graphql'

export const GET_MY_INVOICES = gql`
  query GetMyInvoices {
    getMyInvoices {
      id
      invoiceNumber
      status
      totalAmount
      paidAmount
      balanceDueDate
      sentAt
      createdAt
    }
  }
`

export const GET_INVOICE = gql`
  query GetInvoice($id: ID!) {
    getInvoice(id: $id) {
      id
      invoiceNumber
      status
      depositPercent
      depositAmount
      depositDueDate
      balanceDueDate
      subtotal
      discountType
      discountValue
      discountLabel
      discountAmount
      taxRate
      taxAmount
      totalAmount
      paidAmount
      notes
      paymentInstructions
      sentAt
      paidAt
      createdAt
      lineItems {
        id
        description
        quantity
        unitPrice
        total
        sortOrder
      }
    }
  }
`

export const MARK_INVOICE_VIEWED = gql`
  mutation MarkInvoiceViewed($id: ID!) {
    markInvoiceViewed(id: $id) {
      id
      status
      viewedAt
    }
  }
`

export const useGetMyInvoices = () =>
  useQuery<GetMyInvoicesQuery>(GET_MY_INVOICES, {
    fetchPolicy: 'cache-and-network',
  })

export const useGetInvoice = (id: string) =>
  useQuery<GetInvoiceQuery, GetInvoiceQueryVariables>(GET_INVOICE, {
    variables: { id },
    fetchPolicy: 'cache-and-network',
  })

export const useMarkInvoiceViewed = () =>
  useMutation<MarkInvoiceViewedMutation, MarkInvoiceViewedMutationVariables>(
    MARK_INVOICE_VIEWED
  )
