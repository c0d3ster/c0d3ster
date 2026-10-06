import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateInvoiceForm } from './CreateInvoiceForm'

const push = vi.fn()
const createInvoice = vi.fn()
const sendInvoice = vi.fn()
const loadSuggestions = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/libs/Toast', () => ({ Toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/apiClients', () => ({
  useGetProjects: () => ({
    data: { projects: [{ id: 'p1', title: null, projectName: 'Acme Site' }] },
  }),
  useSuggestedInvoiceLineItems: () => [loadSuggestions],
  useCreateInvoice: () => [createInvoice],
  useUpdateInvoice: () => [vi.fn()],
  useSendInvoice: () => [sendInvoice],
}))

// project -> items -> discount -> terms -> preview
const goToPreview = async (): Promise<void> => {
  fireEvent.change(screen.getByLabelText('Project'), {
    target: { value: 'p1' },
  })
  await waitFor(() => expect(loadSuggestions).toHaveBeenCalled())
  for (let i = 0; i < 4; i++) {
    fireEvent.click(await screen.findByText('NEXT'))
  }
}

describe('CreateInvoiceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    loadSuggestions.mockResolvedValue({
      data: {
        suggestedInvoiceLineItems: [
          {
            feature: 'Database',
            description: 'Database',
            quantity: 1,
            unitPrice: 550,
          },
        ],
      },
    })
    createInvoice.mockResolvedValue({
      data: { createInvoice: { id: 'inv-1' } },
    })
    sendInvoice.mockResolvedValue({})
  })

  it('requires a project before continuing', () => {
    render(<CreateInvoiceForm />)

    expect(screen.getByText('NEXT')).toBeDisabled()
  })

  it('walks the steps, previews the total and saves a draft', async () => {
    render(<CreateInvoiceForm />)
    await goToPreview()

    expect(await screen.findByText('Total: $550.00')).toBeInTheDocument()

    fireEvent.click(screen.getByText('SAVE DRAFT'))

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith('/admin/invoices/inv-1')
    )

    expect(createInvoice.mock.calls[0]?.[0].variables.input).toMatchObject({
      projectId: 'p1',
      lineItems: [{ description: 'Database', unitPrice: 550 }],
    })
    expect(sendInvoice).not.toHaveBeenCalled()
  })

  it('sends immediately with SAVE & SEND', async () => {
    render(<CreateInvoiceForm />)
    await goToPreview()
    fireEvent.click(await screen.findByText('SAVE & SEND'))

    await waitFor(() =>
      expect(sendInvoice).toHaveBeenCalledWith({ variables: { id: 'inv-1' } })
    )
  })
})
