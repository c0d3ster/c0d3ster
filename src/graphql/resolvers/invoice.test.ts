import { GraphQLError } from 'graphql'
import { beforeEach, describe, expect, it } from 'vitest'

import { InvoiceResolver } from '@/graphql/resolvers/invoice'
import { InvoiceStatus, UserRole } from '@/graphql/schema'
import { createMockUser } from '@/tests/mocks/auth'
import {
  createMockInvoiceService,
  createMockUserService,
} from '@/tests/mocks/services'

const createMockInvoice = (overrides = {}) => ({
  id: 'invoice-1',
  projectId: 'project-1',
  clientId: 'user-1',
  invoiceNumber: 'INV-2026-001',
  status: InvoiceStatus.Sent,
  depositPercent: 50,
  depositDueDate: null,
  balanceDueDate: null,
  subtotal: 1000,
  discountType: null,
  discountValue: null,
  discountLabel: null,
  discountAmount: null,
  taxRate: 0,
  taxAmount: 0,
  totalAmount: 1000,
  paidAmount: 0,
  notes: null,
  paymentInstructions: null,
  stripePaymentIntentId: null,
  stripeCheckoutSessionId: null,
  sentAt: null,
  viewedAt: null,
  paidAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  lineItems: [],
  ...overrides,
})

describe('InvoiceResolver', () => {
  let resolver: InvoiceResolver
  let invoiceService: ReturnType<typeof createMockInvoiceService>
  let userService: ReturnType<typeof createMockUserService>

  beforeEach(() => {
    invoiceService = createMockInvoiceService()
    userService = createMockUserService()
    resolver = new InvoiceResolver(
      invoiceService as never,
      userService as never
    )
  })

  describe('admin-only operations', () => {
    beforeEach(() => {
      userService.getCurrentUserWithAuth.mockResolvedValue(
        createMockUser({ role: 'client' })
      )
      userService.checkPermission.mockImplementation(() => {
        throw new GraphQLError('Admin permissions required', {
          extensions: { code: 'FORBIDDEN' },
        })
      })
    })

    it.each([
      ['createInvoice', () => resolver.createInvoice({ projectId: 'p' })],
      ['updateInvoice', () => resolver.updateInvoice('i', {})],
      ['sendInvoice', () => resolver.sendInvoice('i')],
      ['getProjectInvoices', () => resolver.getProjectInvoices('p')],
      ['cancelInvoice', () => resolver.cancelInvoice('i')],
      ['getAllInvoices', () => resolver.getAllInvoices()],
      ['invoiceDashboardSummary', () => resolver.invoiceDashboardSummary()],
      [
        'suggestedInvoiceLineItems',
        () => resolver.suggestedInvoiceLineItems('p'),
      ],
    ])('%s rejects non-admins before touching the service', async (_, call) => {
      await expect(call()).rejects.toThrow('Admin permissions required')
      expect(userService.checkPermission).toHaveBeenCalledWith(
        expect.anything(),
        UserRole.Admin
      )
      expect(invoiceService.createInvoice).not.toHaveBeenCalled()
      expect(invoiceService.updateInvoice).not.toHaveBeenCalled()
      expect(invoiceService.sendInvoice).not.toHaveBeenCalled()
      expect(invoiceService.getProjectInvoices).not.toHaveBeenCalled()
    })
  })

  it('createInvoice maps the result for admins, including depositAmount', async () => {
    userService.getCurrentUserWithAuth.mockResolvedValue(
      createMockUser({ role: 'admin' })
    )
    invoiceService.createInvoice.mockResolvedValue(createMockInvoice())

    const result = await resolver.createInvoice({ projectId: 'project-1' })

    expect(result.depositAmount).toBe(500)
    expect(result.discountAmount).toBeUndefined()
    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z')
  })

  describe('admin management', () => {
    beforeEach(() => {
      userService.getCurrentUserWithAuth.mockResolvedValue(
        createMockUser({ role: 'admin' })
      )
    })

    it('cancelInvoice returns the cancelled invoice', async () => {
      invoiceService.cancelInvoice.mockResolvedValue(
        createMockInvoice({ status: InvoiceStatus.Cancelled })
      )

      const result = await resolver.cancelInvoice('invoice-1')

      expect(invoiceService.cancelInvoice).toHaveBeenCalledWith('invoice-1')
      expect(result.status).toBe(InvoiceStatus.Cancelled)
    })

    it('getAllInvoices passes the status filter through', async () => {
      invoiceService.getAllInvoices.mockResolvedValue([createMockInvoice()])

      const result = await resolver.getAllInvoices(InvoiceStatus.Sent)

      expect(invoiceService.getAllInvoices).toHaveBeenCalledWith(
        InvoiceStatus.Sent
      )
      expect(result).toHaveLength(1)
    })

    it('invoiceDashboardSummary returns the service summary', async () => {
      const summary = {
        outstandingAmount: 10,
        outstandingCount: 1,
        overdueCount: 0,
        paidThisMonthAmount: 5,
      }
      invoiceService.getDashboardSummary.mockResolvedValue(summary)

      expect(await resolver.invoiceDashboardSummary()).toEqual(summary)
    })
  })

  describe('markInvoiceViewed', () => {
    it('marks the owning client invoice viewed', async () => {
      userService.getCurrentUserWithAuth.mockResolvedValue(createMockUser())
      invoiceService.getInvoiceById.mockResolvedValue(createMockInvoice())
      invoiceService.markViewed.mockResolvedValue(
        createMockInvoice({ status: InvoiceStatus.Viewed })
      )

      const result = await resolver.markInvoiceViewed('invoice-1')

      expect(invoiceService.markViewed).toHaveBeenCalledWith('invoice-1')
      expect(result.status).toBe(InvoiceStatus.Viewed)
    })

    it('hides another client invoice', async () => {
      userService.getCurrentUserWithAuth.mockResolvedValue(createMockUser())
      invoiceService.getInvoiceById.mockResolvedValue(
        createMockInvoice({ clientId: 'someone-else' })
      )

      await expect(
        resolver.markInvoiceViewed('invoice-1')
      ).rejects.toMatchObject({ extensions: { code: 'NOT_FOUND' } })
      expect(invoiceService.markViewed).not.toHaveBeenCalled()
    })

    it('does not mark viewed when an admin opens it', async () => {
      userService.getCurrentUserWithAuth.mockResolvedValue(
        createMockUser({ role: 'admin' })
      )
      invoiceService.getInvoiceById.mockResolvedValue(createMockInvoice())

      await resolver.markInvoiceViewed('invoice-1')

      expect(invoiceService.markViewed).not.toHaveBeenCalled()
    })
  })

  describe('getInvoice', () => {
    it('lets a client read their own sent invoice', async () => {
      userService.getCurrentUserWithAuth.mockResolvedValue(createMockUser())
      invoiceService.getInvoiceById.mockResolvedValue(createMockInvoice())
      const result = await resolver.getInvoice('invoice-1')

      expect(result?.id).toBe('invoice-1')
    })

    it('hides another client invoice', async () => {
      userService.getCurrentUserWithAuth.mockResolvedValue(createMockUser())
      invoiceService.getInvoiceById.mockResolvedValue(
        createMockInvoice({ clientId: 'someone-else' })
      )

      await expect(resolver.getInvoice('invoice-1')).rejects.toMatchObject({
        extensions: { code: 'NOT_FOUND' },
      })
    })

    it('hides the client own draft', async () => {
      userService.getCurrentUserWithAuth.mockResolvedValue(createMockUser())
      invoiceService.getInvoiceById.mockResolvedValue(
        createMockInvoice({ status: InvoiceStatus.Draft })
      )

      await expect(resolver.getInvoice('invoice-1')).rejects.toMatchObject({
        extensions: { code: 'NOT_FOUND' },
      })
    })

    it('lets an admin read any invoice', async () => {
      userService.getCurrentUserWithAuth.mockResolvedValue(
        createMockUser({ role: 'admin' })
      )
      invoiceService.getInvoiceById.mockResolvedValue(
        createMockInvoice({
          clientId: 'someone-else',
          status: InvoiceStatus.Draft,
        })
      )
      const result = await resolver.getInvoice('invoice-1')

      expect(result?.status).toBe(InvoiceStatus.Draft)
    })

    it('returns undefined when the invoice does not exist', async () => {
      userService.getCurrentUserWithAuth.mockResolvedValue(createMockUser())
      invoiceService.getInvoiceById.mockResolvedValue(undefined)

      expect(await resolver.getInvoice('nope')).toBeUndefined()
    })
  })

  it('getMyInvoices scopes to the calling client', async () => {
    userService.getCurrentUserWithAuth.mockResolvedValue(createMockUser())
    invoiceService.getClientInvoices.mockResolvedValue([createMockInvoice()])

    const result = await resolver.getMyInvoices()

    expect(userService.checkPermission).toHaveBeenCalledWith(
      expect.anything(),
      UserRole.Client
    )
    expect(invoiceService.getClientInvoices).toHaveBeenCalledWith('user-1')
    expect(result).toHaveLength(1)
  })
})
