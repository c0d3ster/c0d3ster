# Invoice & Billing Epic

## Status: Awaiting Approval — No code written yet. Each phase is implemented in a separate session after this doc is approved.

---

## Context

c0d3ster is a freelance contractor platform with client portal, project management, and provisioning. It currently has `budget` and `paidAmount` fields on projects but zero invoicing infrastructure — no Stripe, no invoice table, no billing flow.

**Goal:** Build a complete invoicing pipeline that lets clients pay through the website, replacing the current Excel-based manual workflow.

**Starting point for itemized billing:** The `ProjectFeature` enum (`Database`, `Auth`, `Email`) will be substantially expanded to cover all real deliverables a client might be charged for.

**Reference implementation:** `clean-cuts-landscaping` — PDF upload + Stripe Checkout + email claim link + webhook to mark paid. This epic adapts that pattern but upgrades it to in-app invoice generation with itemized line items.

---

## Market Research

### Rates (US, senior full-stack)

| Tier | Rate |
|---|---|
| Senior | $100–$180/hr |
| Mid | $50–$90/hr |
| Small site (5–10 pages) | $500–$5,000 flat |
| Medium app (e-commerce, SaaS) | $5,000–$15,000 flat |
| Custom enterprise | $50,000+ |

### Payment Terms (best practices)

- **Net 15** preferred over Net 30
- **Deposit structure by project size:**
  - $500–$2,000: 25% upfront
  - $2,000–$10,000: 50% upfront
  - $10,000+: 30% deposit / 40% at staging / 30% on delivery
- Late fee: 1.5%/month after due date
- Any project >30 days: milestone billing, not a single final invoice

### What goes on an invoice

Invoice number, issue date, due date, client + contractor details, itemized line items (feature/service, qty, unit price, total), subtotal, discount (if any), taxes if applicable, total due, payment instructions.

### Feature-Based Pricing (at ~$125/hr blended rate)

| Feature | Estimate |
|---|---|
| Database design & setup | $300–$800 |
| Authentication system | $200–$500 |
| Email integration | $150–$300 |
| Admin dashboard | $500–$1,500 |
| Payment processing (Stripe) | $300–$800 |
| File upload system | $200–$500 |
| Custom API endpoints | $200–$600 |
| Deployment & CI/CD setup | $150–$350 |
| Domain configuration | $100–$200 |
| SEO setup | $200–$500 |
| CMS integration | $300–$800 |
| Mobile-responsive design | $200–$500 |
| Third-party integrations | $200–$600 |
| Analytics setup | $150–$300 |
| Testing & QA | $200–$500 |
| Project management / consultation | $150–$400 |

---

## Key Files Reference

| File | Purpose |
|---|---|
| `src/graphql/schema/project.ts:45` | Current `ProjectFeature` enum |
| `src/models/projects.ts` | Projects + ProjectRequests Drizzle schemas |
| `src/models/users.ts` | Users schema |
| `src/services/` | All service classes |
| `src/graphql/resolvers/` | All resolvers |
| `src/app/(auth)/admin/` | Admin pages |
| `src/app/(auth)/` | Auth-gated client pages |
| `src/app/api/` | API routes |
| `src/libs/` | Singleton clients (add Stripe here) |
| `clean-cuts-landscaping/src/app/api/invoices/[id]/checkout/route.ts` | Reference Stripe checkout |
| `clean-cuts-landscaping/src/app/api/webhooks/stripe/route.ts` | Reference webhook |
| `clean-cuts-landscaping/src/services/EmailService.ts` | Reference email service |

---

## Epic Phases

---

### Phase 1 — Expand ProjectFeature Enum + Pricing Constants

**Goal:** Make the features enum comprehensive enough to drive itemized invoices.

**Pricing visibility:** `featurePricing.ts` default prices are internal reference data only — they are never exposed to clients. Clients only ever see the final per-item prices on a sent invoice, which the admin sets explicitly per invoice.

#### Files to modify

| File | Change |
|---|---|
| `src/graphql/schema/project.ts` | Expand `ProjectFeature` enum |
| `src/models/projects.ts` | Update DB enum, then run `db:generate` |
| `src/lib/featurePricing.ts` | New — map each feature to `{ label, defaultPrice, description }` — admin-only, never client-facing |

#### New enum values to add

```
AdminDashboard
PaymentProcessing
FileUploads
CustomApi
Deployment
DomainConfig
Seo
CmsIntegration
ResponsiveDesign
ThirdPartyIntegrations
Analytics
Testing
Consultation
ProjectManagement
```

#### Acceptance criteria

- `db:generate` succeeds with no errors
- All new enum values are visible in DB introspection
- `featurePricing.ts` exports a map covering every enum value with `label`, `defaultPrice`, and `description`
- `featurePricing.ts` is not imported in any client-facing component or resolver — only in `InvoiceService`
- Existing `ProjectFeature` values (`Database`, `Auth`, `Email`) remain valid and unchanged

---

### Phase 2 — Invoice Data Model

**Goal:** Add invoices and invoice_line_items tables; link to projects and clients.

#### Files to create

| File | Purpose |
|---|---|
| `src/models/invoices.ts` | Invoice + InvoiceLineItem Drizzle schemas |

#### Invoice table columns

| Column | Type / Notes |
|---|---|
| `id` | UUID, primary key |
| `projectId` | FK to projects |
| `clientId` | FK to users |
| `invoiceNumber` | Human-readable, e.g. `INV-2025-001` |
| `status` | Enum: `draft`, `sent`, `viewed`, `partially_paid`, `paid`, `overdue`, `cancelled` |
| `depositPercent` | Integer, e.g. `50` |
| `depositDueDate` | Date |
| `balanceDueDate` | Date |
| `subtotal` | Numeric (sum of all line items) |
| `discountType` | Enum: `percentage`, `flat` — nullable |
| `discountValue` | Numeric — the raw value (e.g. `10` for 10%, `150.00` for flat) — nullable |
| `discountLabel` | Text — description shown on invoice (e.g. "Friends & Family Discount") — nullable |
| `discountAmount` | Numeric — computed and stored (subtotal * rate or flat value) — nullable |
| `taxRate` | Numeric (decimal, e.g. `0.08`) |
| `taxAmount` | Numeric (applied after discount) |
| `totalAmount` | Numeric (subtotal - discountAmount + taxAmount) |
| `paidAmount` | Numeric |
| `notes` | Text, nullable |
| `paymentInstructions` | Text, nullable |
| `stripePaymentIntentId` | Text, nullable |
| `stripeCheckoutSessionId` | Text, nullable |
| `sentAt` | Timestamp, nullable |
| `viewedAt` | Timestamp, nullable |
| `paidAt` | Timestamp, nullable |
| `createdAt` | Timestamp |
| `updatedAt` | Timestamp |

#### InvoiceLineItem table columns

| Column | Type / Notes |
|---|---|
| `id` | UUID, primary key |
| `invoiceId` | FK to invoices |
| `feature` | `ProjectFeature` enum, nullable (null = custom line item) |
| `description` | Text |
| `quantity` | Numeric (default 1) |
| `unitPrice` | Numeric |
| `total` | Numeric (quantity * unitPrice) |
| `sortOrder` | Integer (for manual reordering) |

#### Migration

Run `db:generate` after creating the schema. Apply with `db:migrate` (requires explicit user approval before running).

#### Acceptance criteria

- Migration applies cleanly with no errors
- Can insert and query invoices + line items via Drizzle
- FK constraints enforce referential integrity on `projectId` and `clientId`
- `invoiceNumber` has a unique constraint

---

### Phase 3 — GraphQL Schema + Resolvers

**Goal:** CRUD for invoices and line items via GraphQL.

#### Files to create / modify

| File | Change |
|---|---|
| `src/graphql/schema/invoice.ts` | New — Invoice, InvoiceLineItem types, InvoiceStatus enum, input types |
| `src/graphql/resolvers/invoice.ts` | New — InvoiceResolver |
| `src/services/InvoiceService.ts` | New — business logic layer |

#### Resolver methods

| Method | Auth | Description |
|---|---|---|
| `createInvoice(projectId, lineItems, depositPercent, notes)` | Admin only | Creates a draft invoice |
| `updateInvoice(id, ...)` | Admin only | Updates any draft/sent invoice field |
| `sendInvoice(id)` | Admin only | Emails client, sets status to `sent` |
| `getInvoice(id)` | Client + Admin | Returns invoice with line items |
| `getProjectInvoices(projectId)` | Admin only | All invoices for a project |
| `getMyInvoices` | Client only | All invoices for the calling client |

#### InvoiceService responsibilities

- Invoice number generation (`INV-YYYY-NNN` sequence)
- Totals calculation in order: subtotal (sum of line items) → discountAmount → taxAmount → totalAmount
- Deposit amount calculation (based on post-discount totalAmount)
- Status transition validation (e.g. can't send a cancelled invoice)
- `featurePricing.ts` is only imported here — never in resolvers or UI

#### Auto-populate from project features

When admin calls `createInvoice(projectId, ...)`, the service looks up `project.features` and pre-fills line items using `featurePricing.ts` defaults. Admin edits/removes/adds custom items before sending.

#### Acceptance criteria

- GraphQL playground: `createInvoice`, `getMyInvoices`, `getProjectInvoices` return correct data
- Only admin can call `createInvoice`, `updateInvoice`, `sendInvoice`, `getProjectInvoices`
- Client role can only call `getInvoice` (for their own invoices) and `getMyInvoices`
- Totals are always consistent with line items (recalculated on every save in order: subtotal → discount → tax → total)
- Discount fields are nullable — omitting them produces no discount line on the invoice

---

### Phase 4 — Stripe Integration

**Goal:** Clients can pay invoices (deposit or full balance) via Stripe Checkout.

#### Files to create

| File | Purpose |
|---|---|
| `src/app/api/invoices/[id]/checkout/route.ts` | Create Stripe Checkout Session |
| `src/app/api/webhooks/stripe/route.ts` | Handle `checkout.session.completed` |
| `src/libs/Stripe.ts` | Singleton Stripe client (mirror clean-cuts pattern) |

#### Checkout flow

1. Client clicks "Pay Deposit" or "Pay Balance" on invoice detail page
2. POST to `/api/invoices/[id]/checkout?mode=deposit|balance`
3. Route creates Stripe Checkout Session with itemized line items
4. Client redirected to Stripe-hosted checkout
5. On success, Stripe fires `checkout.session.completed` webhook
6. Webhook handler:
   - Verifies signature with `STRIPE_WEBHOOK_SECRET`
   - Updates invoice `paidAmount`
   - Transitions status to `partially_paid` or `paid`
   - Syncs `project.paidAmount` field

#### Checkout modes

| Mode | Amount charged |
|---|---|
| `deposit` | `totalAmount * (depositPercent / 100)` |
| `balance` | `totalAmount - paidAmount` |

#### Env vars required

```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

#### Acceptance criteria

- End-to-end test in Stripe test mode: create invoice → checkout → webhook fires → invoice status = `paid`
- Webhook rejects requests with invalid signature
- `project.paidAmount` is synced after payment
- Both `deposit` and `balance` checkout modes work correctly

---

### Phase 5 — Email Delivery

**Goal:** Send invoice to client via email with a link to view and pay.

#### Files to create / modify

| File | Change |
|---|---|
| `src/services/EmailService.ts` | Create if not exists — add `sendInvoiceEmail(invoice, client)` |

#### Email content

- Itemized line items table
- Subtotal, discount (if any, with label), tax (if any), total due
- Deposit amount and due date (if applicable)
- Balance due date
- "Pay Now" button linking to `/invoices/[id]`
- Any notes from the invoice

#### Transport

Use Resend (same as clean-cuts reference).

#### Env vars required

```
RESEND_API_KEY
```

#### Acceptance criteria

- Invoice email received in client inbox with correct line items
- "Pay Now" link navigates to correct invoice detail page
- Email sends on `sendInvoice` resolver call
- Failed sends surface an error (don't silently swallow)

---

### Phase 6 — Client Invoice UI

**Goal:** Clients can view and pay invoices from their portal.

#### Files to create

| File | Purpose |
|---|---|
| `src/app/(auth)/invoices/page.tsx` | Client invoice list |
| `src/app/(auth)/invoices/[id]/page.tsx` | Invoice detail — itemized breakdown + pay button |
| `src/components/molecules/invoice/InvoiceLineItemsTable.tsx` | Renders line items |
| `src/components/molecules/invoice/PayInvoiceButton.tsx` | Deposit / balance pay button |
| `src/components/molecules/invoice/InvoiceStatusBadge.tsx` | Status pill (draft, sent, paid, etc.) |

#### Invoice detail page sections

1. Header: invoice number, status badge, issue date, due date
2. Billed to / from: client and contractor details
3. Line items table: feature/description, qty, unit price, total
4. Totals: subtotal → discount (labeled, e.g. "Friends & Family Discount -10%") → tax → total due
5. Payment section: deposit amount + due date (if not yet paid), remaining balance
6. Pay button (hidden if fully paid)

#### Acceptance criteria

- Client logs in, sees list of their invoices with status
- Invoice detail shows correct itemized breakdown matching what admin created
- Clicking pay redirects to Stripe Checkout
- After payment, status updates on page (re-fetch after return from Stripe)
- Invoice detail marks itself as `viewed` on first load (calls a mutation)

---

### Phase 7 — Admin Invoice Management

**Goal:** Admin can create, manage, and track invoices from the dashboard.

#### Files to create

| File | Purpose |
|---|---|
| `src/app/(auth)/admin/invoices/page.tsx` | Invoice list with status filters |
| `src/app/(auth)/admin/invoices/new/page.tsx` | Create invoice form |
| `src/app/(auth)/admin/invoices/[id]/page.tsx` | Invoice detail + status management |
| `src/components/molecules/admin/CreateInvoiceForm.tsx` | Multi-step create form |
| `src/components/molecules/admin/InvoiceLineItemEditor.tsx` | Add/edit/remove/reorder line items |

#### Create invoice form flow

1. Pick project (dropdown) — auto-populates client and features
2. Review auto-populated line items from `project.features` + `featurePricing.ts` defaults
3. Edit line items: change prices, remove items, add custom items
4. Optionally apply a discount: choose percentage or flat amount, enter value, add a label (e.g. "Friends & Family Discount")
5. Set deposit percent + deposit due date + balance due date
6. Add notes / payment instructions (optional)
7. Preview invoice as client would see it
8. Save as draft or send immediately

#### Admin dashboard integration

- Add invoice summary card to `AdminDashboardSection`
- Shows: total outstanding, count of overdue invoices, total paid (current month)

#### Acceptance criteria

- Admin creates invoice from project, edits line items, sends — invoice appears in client portal
- Invoice list filterable by status (all, draft, sent, overdue, paid)
- Admin can mark invoice as `cancelled`
- Dashboard card shows correct outstanding/overdue counts

---

## Environment Variables Summary

| Var | Phase | Purpose |
|---|---|---|
| `STRIPE_SECRET_KEY` | 4 | Stripe API calls |
| `STRIPE_WEBHOOK_SECRET` | 4 | Webhook signature verification |
| `RESEND_API_KEY` | 5 | Email delivery |

---

## Implementation Notes

- Never hand-write migration SQL — always edit the model then run `db:generate`
- Never run `db:migrate` without explicit user approval
- `featured` (dev/admin portfolio) and `isFavorite` (client bookmark) are separate columns — invoice work must not conflate them
- `title` is intentionally distinct from `projectName` — do not remove it
