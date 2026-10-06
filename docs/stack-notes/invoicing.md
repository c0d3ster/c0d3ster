# Stack: invoicing

## #3 Add LLM pass for intelligent project type, features, and title

Branch: overnight/2026-09-20/03-project-inference-service

### Predecessor note (read this first)

This task was dispatched as the *start* of the `invoicing` stack this run (no
`docs/stack-notes/invoicing.md` existed yet, so the run's dispatcher branched
from `main`). In reality, `#2 [stack: invoicing] Add "features" as advanced
request options` was already implemented in an earlier run
(2026-08-06, branch `overnight/2026-08-06/02-project-feature-advanced-options`)
but its PR (**#77**) is still open/unmerged, and it predates this stack-notes
convention. So this task was built **on top of `main`, not on top of #77**.

Concretely, on `main` today:
- `ProjectFeature` enum still only has `Database | Auth | Email` (#2's 13
  extra values haven't landed).
- `projectRequests` / `CreateProjectRequestInput` / the Zod form schema have
  no `features` field (only `projects` — the post-approval table — has one).
- `title` *does* already exist end-to-end (`CreateProjectRequestInput` →
  `ProjectRequestService.createProjectRequest` → DB) but was never exposed as
  a form field.

**Recommendation for whoever merges next**: merge/rebase #77 before or
alongside this task's PR. The two don't conflict at the code level (this
task never touches `ProjectRequestForm.tsx`'s Requirements section or the
enum), but until #77 merges, the suggestion flow below can only prefill
`projectType` and `title` for real — `features` suggestions are surfaced
read-only, not written to a real form field.

### What was built

- `src/services/ProjectInferenceService.ts` — the isolated, swappable
  inference service. Public contract is exactly one method:
  `inferProjectDetails({ projectName, description }): Promise<{ projectType, features, title }>`.
  Internal request/result types are intentionally **not exported** (knip
  flagged them as unused-outside-file; the swappable contract is the class's
  public method signature, not the type names).
- **Provider choice: raw `fetch` against the Anthropic Messages API, no new
  SDK dependency.** The task's NEEDS HUMAN note suggested "pick a provider,
  add the dependency" — deviated from that literal instruction because the
  repo's own established convention for every other external API
  (`GitHubService.ts`, `VercelService.ts`, `NeonService.ts`) is a plain
  `fetch` call with an `Env`-gated `*_NOT_CONFIGURED` GraphQLError, no SDK.
  Matching that convention is leaner (no new dependency to maintain) and
  consistent. Model used: `claude-haiku-4-5-20251001` (cheap/fast, fine for a
  small structured-classification call).
- `ProjectType`/`ProjectFeature` valid values are read from the enums at
  request time and included in the prompt — when #2's enum expansion lands,
  this service automatically offers the new feature values with no code
  change here.
- Malformed/empty LLM output degrades gracefully: JSON parse failures and
  zod validation failures both throw a `GraphQLError` with
  `extensions.code: 'PROJECT_INFERENCE_MALFORMED'` (never an uncaught
  exception). The resolver lets it propagate; the form's `handleSuggest`
  wraps the mutation call in try/catch and shows `Toast.error` on any
  failure — the rest of the form stays fully interactive and submittable.
- GraphQL: `ProjectInferenceInput` / `ProjectInferenceSuggestion` types in
  `src/graphql/schema/projectRequest.ts`; `inferProjectDetails` mutation on
  `ProjectRequestResolver` (auth: `UserRole.Client`, same as
  `createProjectRequest`). Registered in the DI container in
  `src/graphql/index.ts`.
- `ANTHROPIC_API_KEY` added to `src/libs/Env.ts` as optional (server-only).
- Form wiring (`ProjectRequestForm.tsx`): new "SUGGEST PROJECT TYPE & TITLE"
  button (requires project name + description first, mirrors existing
  inline-validation style). On success, prefills `projectType` and the new
  `title` field (added to the form for the first time — the GraphQL/DB
  plumbing already existed, just no UI). `features` suggestions are shown as
  a read-only hint line ("Suggested features: …") since there's no real
  `features` form field to write into yet on this branch — see predecessor
  note above.
- Added `title` (optional) to the Zod schema in
  `src/validations/ProjectRequestValidation.ts`.
- Ran `npm run codegen` to regenerate `src/graphql/generated/graphql.ts` for
  the new mutation/types.

### Tests added

- `src/services/ProjectInferenceService.test.ts` — success path, missing
  API key, HTTP failure, network failure, empty response, non-JSON
  response, schema-invalid JSON (all three malformed cases assert
  `PROJECT_INFERENCE_MALFORMED` and that a `GraphQLError` is thrown, not an
  uncaught error).
- `src/graphql/resolvers/ProjectRequestResolver.test.ts` — added
  `inferProjectDetails` describe block (auth required, happy path, failure
  propagation); updated the constructor calls for the new third DI arg.
- `src/components/molecules/project-request/ProjectRequestForm.test.tsx` —
  added a `suggest project details` describe block: guards on empty
  name/description, successful prefill, and the malformed/error path
  asserting the form stays usable (submit button still enabled, prior input
  untouched).

### Deviations from the task's acceptance criteria

- No LLM SDK dependency was added (see provider-choice note above) — code
  runs against a real provider via `fetch`, same practical outcome.
- `features` are suggested but not yet prefillable into a real, persisted
  form field, because that field doesn't exist on `main` (it's #2's job).
  Acceptance criterion "submitting a description produces sensible
  suggested type/features/title" is met for type/title; features are
  produced and surfaced, just not yet wired to persistence — full wiring is
  a small follow-up once #77 merges (swap the read-only hint for a real
  checkbox-group prefill, same pattern #2 already builds for Requirements).

### NEEDS HUMAN

- Add a real `ANTHROPIC_API_KEY` to `.env` before this can run end-to-end in
  any environment (dev/staging/prod). Without it, `inferProjectDetails`
  throws a clean `PROJECT_INFERENCE_NOT_CONFIGURED` GraphQLError — the rest
  of the app is unaffected.

## #4 Invoice data model

Branch: overnight/2026-10-06/r1-02-t4-invoice-data-model

### What was built

- `src/models/invoices.ts` — `invoices` and `invoiceLineItems` Drizzle tables
  per the Phase 2 column specs, plus `InvoiceRecord` / `InvoiceLineItemRecord`
  types. Exported from `src/models/index.ts` (and added to `schemas`).
- `src/models/enums.ts` — `invoiceStatusEnum` (`invoice_status`) and
  `discountTypeEnum` (`discount_type`), derived from the TS enums.
- **`src/graphql/schema/invoice.ts` is a stub created by this task**: only
  `InvoiceStatus`, `DiscountType` and their `registerEnumType` calls, already
  re-exported from `schema/index.ts`. **#5 must build on this file, not
  recreate it.**
- Migration `migrations/0022_cold_magik.sql` (generated, NOT applied).

### Key decisions

- `projectId` / `clientId` FKs use no cascade (restrict) so invoices survive
  project/client edits. Judgment call, not in the doc.
- `invoice_line_items.invoiceId` cascades on delete (line items are owned by
  the invoice).
- Money columns are `decimal(10,2, mode number)`; `taxRate` is
  `decimal(5,4)` (e.g. `0.0800`); `quantity` is `decimal(10,2)` default 1.
- `subtotal`, `taxRate`, `taxAmount`, `totalAmount`, `paidAmount` are NOT NULL
  default 0; discount fields nullable per doc.
- `invoiceLineItems.feature` is `varchar(50)` typed as `ProjectFeature`
  (nullable = custom item), not a new pg enum, so `ProjectFeature` growth
  (#2) never needs an enum-alter migration. Same approach as the JSON
  `features` columns elsewhere.
- Deposit/balance due dates use `date` columns (mode `date`).
- `invoiceNumber` unique constraint `uq_invoices_invoice_number`.

### Deviations from acceptance criteria

- Migration generated but not applied (see NEEDS HUMAN). Insert/query
  against a live DB was therefore not verified here.

### NEEDS HUMAN

- Run `npm run db:migrate` and confirm `0022_cold_magik` applies cleanly
  before #5 and later tasks proceed.

## #5 GraphQL schema + resolvers

Branch: overnight/2026-10-06/r1-03-t5-invoice-graphql-resolvers

### What was built

- `src/graphql/schema/invoice.ts` (built on #4's enum stub): `Invoice`,
  `InvoiceLineItem` object types; `InvoiceLineItemInput`, `CreateInvoiceInput`,
  `UpdateInvoiceInput` input types. `Invoice` exposes a computed
  `depositAmount` (post-discount `totalAmount` x `depositPercent`). Dates are
  ISO strings. Stripe ids are intentionally not exposed.
- `src/graphql/resolvers/invoice.ts` — `InvoiceResolver(invoiceService, userService)`:
  `createInvoice`, `updateInvoice`, `sendInvoice`, `getProjectInvoices` (all
  admin-only via `checkPermission(user, UserRole.Admin)`), `getInvoice`,
  `getMyInvoices`. Registered in `resolvers/index.ts` and the DI container in
  `src/graphql/index.ts`. `schema/index.ts` already re-exported `./invoice`.
- `src/services/InvoiceService.ts` (+ `invoiceService` instance in
  `services/index.ts`, `InvoiceDetail` type exported): CRUD, status transition
  map, `INV-YYYY-NNN` generation, feature auto-populate.
- Exports from `InvoiceService.ts`: `calculateInvoiceTotals` (the one pure
  subtotal -> discount -> tax -> total function, used by create AND update),
  `calculateDepositAmount`.
- Test infra: `invoices`/`invoiceLineItems` added to the global DB mock and
  `inArray`/`like` to the drizzle-orm mock in `tests/setup.ts`;
  `createMockInvoiceService` in `tests/mocks/services.ts`.

### Key decisions

- `createInvoice`: omitted `lineItems` = auto-populate from `project.features`
  via `featurePricing`; an explicit list is used as-is (no merge). `clientId`
  is taken from the project.
- Invoice number: `COUNT(*)` of `INV-<year>-%` inside `db.transaction`; a
  unique violation (pg 23505, also checked on `.cause`) maps to a `CONFLICT`
  GraphQLError ("please retry"). No automatic retry.
- Discounts: flat is capped at subtotal; percentage 0-100; `discountAmount`
  is null when no discount. `updateInvoice` treats `undefined` as unchanged and
  explicit `null` on discount fields as clear (which nulls all four discount
  columns). Tax is applied after discount.
- `updateInvoice` only allowed in draft/sent status; passing `lineItems`
  replaces all items; totals recomputed from existing items otherwise.
- Clients never see drafts: `getInvoice` returns NOT_FOUND for another
  client's invoice or their own draft; `getClientInvoices` excludes drafts.
  Admins see everything. `getMyInvoices` uses `checkPermission(Client)`, so
  admins can call it too (existing hierarchy behavior).
- Status transition map lives in the service; only `sendInvoice` uses it so
  far (draft -> sent). Later payment tasks should reuse `assertTransition`
  (currently module-private).

### Deviations from acceptance criteria

- `sendInvoice` only validates and sets `status=sent` + `sentAt`; it does NOT
  email the client. Email delivery is Phase 5 per the epic.
- Not verified against a live DB (migration `0022` from #4 still unapplied);
  covered by mocked unit tests only.

## #6 Stripe integration

Branch: overnight/2026-10-06/r1-04-t6-stripe-integration

### What was built

- `src/libs/Stripe.ts`: `getStripe()` lazy singleton (function, not class),
  throws if `STRIPE_SECRET_KEY` is missing. Added `stripe` dependency.
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` in `src/libs/Env.ts` (optional,
  like R2/Anthropic) and in `DEVELOPMENT.md`.
- `src/app/api/invoices/[id]/checkout/route.ts`: `POST ?mode=deposit|balance`.
  Clerk `auth()` -> `users` by `clerkId` -> `invoiceService.getInvoiceById` ->
  owner + status checks -> Checkout Session (`metadata: { invoiceId, mode }`).
  Returns `{ url }`. Non-owners and drafts get 404/400, never another
  client's data.
- `src/app/api/webhooks/stripe/route.ts`: raw body + `stripe-signature` ->
  `constructEvent`; missing/invalid signature = 400, missing secret = 500.
  Handles `checkout.session.completed` only (and only `payment_status=paid`).
  Transient errors return 500 (Stripe retries); `NOT_FOUND`/`INVALID_STATUS`
  return 200 so unfixable states don't retry forever. Path matches the
  middleware's `api/webhook` exclusion, so no Clerk middleware runs on it.
- `src/libs/invoiceCheckout.ts`: pure helpers `calculateCheckoutCents`,
  `buildCheckoutLineItems`, `isCheckoutMode`.
- `InvoiceService.recordPayment({ invoiceId, amount, checkoutSessionId,
  paymentIntentId })`: one transaction, row-locked invoice, adds to
  `paidAmount`, sets `partially_paid` / `paid` (+ `paidAt`), stores the Stripe
  ids, then sets `project.paidAmount` to the SUM of that project's invoice
  `paidAmount`s (derived, so replays can't double count).

### Key decisions

- Deposit = `totalAmount * depositPercent`, allowed only while invoice
  `paidAmount` is 0. Balance = `totalAmount - paidAmount`.
- Itemized lines: if the charge equals the natural item+tax total, each item
  is its own Stripe line. Otherwise (deposit, partial balance, discount) the
  amounts are scaled proportionally with largest-remainder rounding so lines
  sum to the charge exactly, with " (deposit)"/" (balance)" name suffixes.
  Each line is quantity 1 (Stripe needs integer quantities; invoice
  quantities are decimal).
- Idempotency: `stripeCheckoutSessionId` equal to the event's session = replay,
  skipped. Only the last session id is kept per invoice.
- `success_url`/`cancel_url` point to `/dashboard/invoices/<id>?payment=...`,
  which is the Phase 6 page and does not exist yet.

### Deviations from acceptance criteria

- The true Stripe test-mode end-to-end run was NOT done (no keys, migration
  `0022` still unapplied). Covered by unit tests: webhook signature is checked
  with real `constructEvent` against signed/forged/tampered payloads; checkout
  and `recordPayment` are mocked-DB tests for deposit, balance, partial, paid.

### NEEDS HUMAN

- Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env` (webhook
  endpoint `/api/webhooks/stripe`, event `checkout.session.completed`; locally
  `stripe listen --forward-to localhost:3000/api/webhooks/stripe`).
- Apply migration `0022` (`pnpm db:migrate`), then run the test-mode flow:
  create + send invoice, POST checkout in each mode, pay with `4242 4242 4242 4242`.
