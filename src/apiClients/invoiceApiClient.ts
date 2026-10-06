import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react'
import { gql } from 'graphql-tag'

import type {
  CancelInvoiceMutation,
  CancelInvoiceMutationVariables,
  CreateInvoiceMutation,
  CreateInvoiceMutationVariables,
  GetAllInvoicesQuery,
  GetAllInvoicesQueryVariables,
  GetInvoiceQuery,
  GetInvoiceQueryVariables,
  GetMyInvoicesQuery,
  InvoiceDashboardSummaryQuery,
  MarkInvoiceViewedMutation,
  MarkInvoiceViewedMutationVariables,
  SendInvoiceMutation,
  SendInvoiceMutationVariables,
  SuggestedInvoiceLineItemsQuery,
  SuggestedInvoiceLineItemsQueryVariables,
  UpdateInvoiceMutation,
  UpdateInvoiceMutationVariables,
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
      projectId
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
        feature
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

// Admin operations

export const GET_ALL_INVOICES = gql`
  query GetAllInvoices($status: InvoiceStatus) {
    getAllInvoices(status: $status) {
      id
      projectId
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

export const INVOICE_DASHBOARD_SUMMARY = gql`
  query InvoiceDashboardSummary {
    invoiceDashboardSummary {
      outstandingAmount
      outstandingCount
      overdueCount
      paidThisMonthAmount
    }
  }
`

export const SUGGESTED_INVOICE_LINE_ITEMS = gql`
  query SuggestedInvoiceLineItems($projectId: ID!) {
    suggestedInvoiceLineItems(projectId: $projectId) {
      feature
      description
      quantity
      unitPrice
    }
  }
`

export const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      id
      status
    }
  }
`

export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice($id: ID!, $input: UpdateInvoiceInput!) {
    updateInvoice(id: $id, input: $input) {
      id
      status
    }
  }
`

export const SEND_INVOICE = gql`
  mutation SendInvoice($id: ID!) {
    sendInvoice(id: $id) {
      id
      status
      sentAt
    }
  }
`

export const CANCEL_INVOICE = gql`
  mutation CancelInvoice($id: ID!) {
    cancelInvoice(id: $id) {
      id
      status
    }
  }
`

export const useGetAllInvoices = (
  status?: GetAllInvoicesQueryVariables['status']
) =>
  useQuery<GetAllInvoicesQuery, GetAllInvoicesQueryVariables>(
    GET_ALL_INVOICES,
    {
      variables: { status },
      fetchPolicy: 'cache-and-network',
    }
  )

export const useInvoiceDashboardSummary = () =>
  useQuery<InvoiceDashboardSummaryQuery>(INVOICE_DASHBOARD_SUMMARY, {
    fetchPolicy: 'cache-and-network',
  })

export const useSuggestedInvoiceLineItems = () =>
  useLazyQuery<
    SuggestedInvoiceLineItemsQuery,
    SuggestedInvoiceLineItemsQueryVariables
  >(SUGGESTED_INVOICE_LINE_ITEMS, { fetchPolicy: 'network-only' })

export const useCreateInvoice = () =>
  useMutation<CreateInvoiceMutation, CreateInvoiceMutationVariables>(
    CREATE_INVOICE
  )

export const useUpdateInvoice = () =>
  useMutation<UpdateInvoiceMutation, UpdateInvoiceMutationVariables>(
    UPDATE_INVOICE
  )

export const useSendInvoice = () =>
  useMutation<SendInvoiceMutation, SendInvoiceMutationVariables>(SEND_INVOICE)

export const useCancelInvoice = () =>
  useMutation<CancelInvoiceMutation, CancelInvoiceMutationVariables>(
    CANCEL_INVOICE
  )
