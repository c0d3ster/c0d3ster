# c0d3ster Tasks

Instructions for agent: This file is the task inventory only. Workflow rules (branching, PRs, testing, archival, NEEDS HUMAN annotations) live in CLAUDE.md under "Overnight Agent Workflow". Work through Agent-Ready tasks in order. Do not attempt Decisions items; those require human input.

Spec reference: docs/INVOICE_BILLING_EPIC.md defines the full invoicing pipeline across 7 phases with file locations, schemas, acceptance criteria, and implementation notes. Tasks below reference it by phase. If the doc and this file conflict, the doc wins; annotate the conflict here.

Invoice implementation rule (from doc): never hand-write migration SQL — edit the model then run db:generate. Never run db:migrate without explicit user approval; annotate NEEDS HUMAN when that step is reached.

## Agent-Ready

- [ ] #14 [stack: solo] Wire the project-approval form's data (internal notes, priority, tech stack, budget override, dates) through to persistence — currently silently dropped.
  - Root cause chain, confirmed in code: `ProjectRequestCard.tsx`'s approval modal (lines 309-329) collects `internalNotes` plus `startDate`/`estimatedCompletionDate`/`priority`/`techStack`/`budget` into local state and passes it to `approveAction`, but `AdminDashboardSection.tsx:46-49` (`handleApproveRequest`) receives it as `_approvalData: any` and never uses it — only `{ id: requestId }` is sent. The GraphQL mutation itself doesn't even accept more: `approveProjectRequest(id: $id)` (`projectRequestApiClient.ts:65`, resolver at `ProjectRequestResolver.ts:97`, service at `ProjectRequestService.ts:235`) takes only `id`. So none of this data has ever reached the server.
  - Add an `ApproveProjectRequestInput` GraphQL input type (`src/graphql/schema/projectRequest.ts` or `project.ts`) with `internalNotes?`, `priority?`, `techStack?`, `budget?`, `startDate?`, `estimatedCompletionDate?`; thread it through the mutation, resolver, and `ProjectRequestApiClient.approveProjectRequest`.
  - In `ProjectRequestService.approveProjectRequest` (`ProjectRequestService.ts:264-326`), set the new fields on the `projects` insert inside the existing transaction — `internalNotes` already exists as a column on `projects` (`models/projects.ts:102`), no migration needed for it; confirm `priority`/`techStack`/`startDate`/`estimatedCompletionDate` columns too (they appear to already exist on `projects` per the same model file — verify before assuming a migration is required).
  - Fix `AdminDashboardSection.tsx:46-49` to actually pass `_approvalData` (typed via the new input, not `any`) into the mutation call instead of discarding it.
  - There's currently no UI anywhere under `src/app` that displays `projects.internalNotes` after approval. `ProjectDetailsTemplate.tsx` (`app/(public)/projects/[slug]/page.tsx`) is the only existing project-detail view, but it's the public-facing showcase page — internal notes must not render there. Admin/dev-facing display needs its own surface; no authed project-detail page exists yet, so add one (e.g. `app/(auth)/dashboard/projects/[id]/page.tsx`) or another admin-gated location, implementation judgment call.
  - Acceptance: submitting the approval form's internal notes (and the other fields) actually persists on the created `projects` row and is visible to an admin/dev afterward, not just captured in a form that throws it away.
  - Side note (small, same area): in `ProjectRequestCard.tsx` the "Additional Info" block currently renders before "Timeline" (order is Description → Features → Additional Info → Timeline, lines 122-156). Move "Additional Info" to render last, after Timeline, while in this file for the above fix.

- [ ] #3 [stack: invoicing] Add LLM pass for intelligent project type, features, and title, inferred from project description and name.
  - Note: may eventually merge with the Modernizer categorization package — confirmed that work doesn't exist yet in Modernizer (nothing found there), so this is a standalone task with just a forward-compatibility note, not a real dependency.
  - NEEDS HUMAN: no LLM SDK dependency exists in `package.json` yet — pick a provider, add the dependency and API key env var before this can run end-to-end. Code can still be written against it.
  - Keep isolated in a new `src/services/ProjectInferenceService.ts` with a narrow `{ description, projectName } → { projectType, features, title }` contract specifically so it's swappable/mergeable later.
  - Wire into `ProjectRequestForm.tsx` as a "suggest" action that prefills `projectType`/`features` (from #2's new field)/`title`, all remaining user-editable.
  - Missing acceptance criteria: malformed/empty LLM response must degrade gracefully — form stays usable, no crash.
  - Acceptance: submitting a description produces sensible suggested type/features/title; user can override all suggestions.

- [ ] #4 [stack: invoicing] Invoice data model — Phase 2 per docs/INVOICE_BILLING_EPIC.md.
  - Create `src/models/invoices.ts` with Invoice and InvoiceLineItem Drizzle schemas per the column specs in the doc. Follow `projects.ts` conventions: `decimal(...,{mode:'number'})` for money, `.$onUpdate()` for `updatedAt`, `unique()` for `invoiceNumber`, `index()` for FKs.
  - Ordering wrinkle: `InvoiceStatus`/`DiscountType` are TS enums that Phase 3 (#5) is nominally responsible for, but Phase 2's Drizzle enum column needs them first. This task should create `src/graphql/schema/invoice.ts` as a stub containing just those two enums + `registerEnumType` calls; #5 builds the rest of that file on top. Note this in the stack-notes/PR so #5 doesn't recreate the file.
  - FK `onDelete` behavior for `projectId`/`clientId` isn't specified in the doc — use no cascade (restrict) so invoices survive project edits; note as a judgment call in the PR.
  - Acceptance: migration applies cleanly; can insert and query invoices + line items via Drizzle; FK constraints on projectId and clientId; unique constraint on invoiceNumber.
  - NEEDS HUMAN: run `db:migrate` and verify migration applies cleanly before proceeding.

- [ ] #5 [stack: invoicing] GraphQL schema + resolvers — Phase 3 per docs/INVOICE_BILLING_EPIC.md.
  - Complete `src/graphql/schema/invoice.ts` (building on #4's enum stub) following `project.ts`'s ObjectType/InputType structure (`project.ts:1-49, 260-345`).
  - Create `src/graphql/resolvers/invoice.ts` (`InvoiceResolver`) and `src/services/InvoiceService.ts` per the resolver method table and service responsibilities in the doc. Follow the DI + auth pattern in `FileResolver.ts:32-36, 50-51` (`getCurrentUserWithAuth()` + `checkPermission(user, UserRole.Admin)`).
  - `InvoiceService` invoice-number generation (`INV-YYYY-NNN`): use a `COUNT`-based per-year sequence inside a `db.transaction` (mirror `ProjectRequestService.approveProjectRequest`, `ProjectRequestService.ts:266-325`), with the `invoiceNumber` unique constraint from #4 as a backstop against races.
  - Implement totals math (subtotal → discount → tax → total) as one pure function shared by create/update so it can't drift.
  - Auto-populate line items from `project.features` via `featurePricing.ts` (#2) on `createInvoice`. `featurePricing.ts` is only imported here — never in resolvers or UI.
  - Register the resolver/schema in `src/graphql/resolvers/index.ts` and `src/graphql/schema/index.ts`.
  - Acceptance: per Phase 3 acceptance criteria in the doc (admin-only for createInvoice/updateInvoice/sendInvoice/getProjectInvoices; client can only call getInvoice for own invoices + getMyInvoices; totals always consistent; discount fields nullable with no discount line when omitted).

- [ ] #6 [stack: invoicing] Stripe integration — Phase 4 per docs/INVOICE_BILLING_EPIC.md.
  - Reference implementation pulled from `c0d3ster/clean-cuts-landscaping` (private repo, accessible via `gh api`) — concrete patterns to mirror, not just a pointer:
    - `src/libs/Stripe.ts`: lazy singleton via a `getStripe()` function (not a class), throws if `STRIPE_SECRET_KEY` missing.
    - Checkout route (`src/app/api/invoices/[id]/checkout/route.ts`): Clerk `auth()` → look up `db.users` by `clerkId` → load invoice → validate ownership/status → create Checkout Session with `metadata: { invoiceId }`. This matches c0d3ster's own existing raw-API-route-with-Clerk convention already used in `src/app/api/webhook/clerk/route.ts`.
    - Deltas beyond the reference: c0d3ster needs itemized `line_items` (not one lump sum) and `deposit`/`balance` mode switching via a query param (`?mode=deposit|balance`, per the doc's Checkout modes table) — clean-cuts only ever charges the full amount once.
    - Webhook route (`src/app/api/webhooks/stripe/route.ts`): mirror signature verification + `constructEvent` + reject-on-invalid-signature almost exactly.
    - Delta: c0d3ster needs `partially_paid` vs `paid` status branching and a `project.paidAmount` sync, where clean-cuts just flips straight to `paid`.
  - Add `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` to `src/libs/Env.ts`'s validated env schema (same place R2 vars are checked, per `FileService.ts:27-36`), not just `.env`.
  - Webhook signature rejection is security-sensitive — treat as a correctness-critical acceptance point.
  - Acceptance: end-to-end test in Stripe test mode (create invoice → checkout → webhook fires → invoice status = paid); webhook rejects invalid signature; project.paidAmount synced; both deposit and balance modes work.
  - NEEDS HUMAN: add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to .env before end-to-end testing.

- [ ] #7 [stack: invoicing] Email delivery — Phase 5 per docs/INVOICE_BILLING_EPIC.md.
  - Reference implementation pulled from `clean-cuts-landscaping/src/services/EmailService.ts` — but it reveals a convention mismatch worth flagging rather than copying blindly: it wraps Resend in an `EmailService` class with hand-escaped raw HTML strings. c0d3ster's own existing convention is different — `ContactService` calls a plain exported function (`sendContactFormEmail`) that renders a React Email `.tsx` template (`src/emails/ContactFormEmail.tsx`), no class wrapper, no manual escaping (JSX handles it).
  - Recommend following c0d3ster's own convention over the doc's literal instruction: new `src/emails/InvoiceEmail.tsx` + exported `sendInvoiceEmail()` function, called directly from `InvoiceService` — skip the `src/services/EmailService.ts` class layer the doc names, for consistency with local convention.
  - Check whether `RESEND_API_KEY` is already validated in `Env.ts` before flagging NEEDS HUMAN — `ContactService` already sends email today, so it may already be configured.
  - Mirror `ContactService.submitContactForm`'s try/catch + `GraphQLError` rethrow (`ContactService.ts:23-52`) so failures surface rather than swallow.
  - Acceptance: invoice email received with correct line items; "Pay Now" link navigates to correct invoice detail page; sends on `sendInvoice` resolver call; failed sends surface an error.

- [ ] #8 [stack: invoicing] Client invoice UI — Phase 6 per docs/INVOICE_BILLING_EPIC.md.
  - New `(auth)/invoices` route group, sibling to `(auth)/dashboard` — consistent with existing structure.
  - New molecules under `src/components/molecules/invoice/` (`InvoiceLineItemsTable.tsx`, `PayInvoiceButton.tsx`, `InvoiceStatusBadge.tsx`), following the `project-request/` folder-per-feature convention.
  - Missing resolver: "marks itself as viewed on first load" needs a `markInvoiceViewed`-style mutation not listed in Phase 3's method table — add it here (or in #5 if that PR hasn't merged yet).
  - Acceptance: per Phase 6 acceptance criteria in the doc (client sees invoice list with status; detail shows correct itemized breakdown; pay redirects to Stripe Checkout; status updates after payment return; marks itself viewed on first load).

- [ ] #9 [stack: invoicing] Admin invoice management — Phase 7 per docs/INVOICE_BILLING_EPIC.md.
  - No `app/(auth)/admin/*` route tree exists yet — admin functionality today lives entirely inline in `/dashboard` via `AdminDashboardSection.tsx`. This task may be introducing the first standalone `/admin` routes; investigate at implementation time rather than assuming a pattern to mirror.
  - Dashboard summary card goes into `AdminDashboardSection.tsx` (`src/components/organisms/dashboard/sections/AdminDashboardSection.tsx`), sourced from a new resolver query (e.g. `invoiceDashboardSummary`) — same "missing resolver method" situation as #8.
  - No existing multi-step form pattern in the codebase (`ProjectRequestForm.tsx` is single-step) — `CreateInvoiceForm` will be a new pattern, not a reuse of an existing one.
  - Acceptance: per Phase 7 acceptance criteria in the doc (admin creates/edits/sends invoice from project, appears in client portal; list filterable by status; admin can cancel; dashboard card shows correct outstanding/overdue counts).

- [ ] #10 [stack: solo] Hero video for home page ("Power up your project today"): circuitry + logo-formation effect, no video asset needed.
  - Reconsidered from the original "Kaiber video" framing after reviewing the brand reference image (navy background, cyan PCB-style circuit traces radiating outward, green "c0d3ster" wordmark, green circular power-icon mark). Both effects the task wanted (circuitry, wordmark forming/shrinking into the corner logo) are achievable in pure CSS/SVG — no video, no external asset, no NEEDS HUMAN blocker.
  - New SVG circuit-trace background component (e.g. `src/components/atoms/CircuitBackground.tsx`), hand-authored paths radiating outward with node-dot accents matching the reference image's PCB style. Optionally animate traces drawing in on mount via `stroke-dasharray`/`stroke-dashoffset` — fits the existing terminal/typewriter "booting up" motif already in `HeroSection.tsx`.
  - Open call: the reference image uses navy/cyan/green; the site's current theme is monochrome green-on-black throughout (`HeroSection.tsx`, `SiteHeader.tsx`). Recommend dim green traces for palette consistency rather than introducing blue — adjustable in the PR, not a blocker either way.
  - Shrink-into-corner effect: `SiteHeader.tsx` already renders the real logo (`LOGO_PATH`) top-left (`SiteHeader.tsx:279-287`) and already fades it in on scroll over a `50px → 225px` window (`SiteHeader.tsx:147-153`). Extend `HeroSection.tsx`'s existing `scrollY`-driven transform (already used for the side matrix bars, lines 26-39) to scale/translate the "c0d3ster" wordmark toward the top-left, timed to match the header's fade-in window exactly — the hero mark visually shrinks away just as the real header logo fades in. Pure CSS transform sync between two components, no DOM reparenting, no asset needed.
  - Acceptance (revised, replaces original video-dependent criteria): circuit background renders behind hero content; wordmark shrinks/translates toward the header logo position in sync with the header's existing fade-in; no layout regressions on mobile; entirely CSS/SVG, no video file added.

## Research (agent can draft findings, human decides)

- [ ] #11 [stack: solo] Research client acquisition channels: Craigslist, Fiverr, other freelance platforms, Meta/Google ads. Also cover the Modernizer market-discovery pipeline's greenfield-lead handoff. Write to docs/research/client-acquisition.md.
  - `c0d3ster/the-modernizer` (public repo, pulled via `gh api`) has `docs/market-discovery.md`, a fully-specified but not-yet-built pipeline (`scripts/discover-candidates.ts` doesn't exist yet — only `compare-generators.sh` does). It already defines a `greenfield-leads.csv` output schema for businesses with no website at all: `business_name, phone, address, city, state, vertical, review_count, rating, place_id`.
  - Per human clarification: c0d3ster's responsibility is the consumption side — ingesting `greenfield-leads.csv` once Modernizer produces it, and turning entries into outreach → project requests / provisioning. The doc should cover: (a) documenting that pipeline and CSV schema as the primary/near-term lead source, (b) c0d3ster's ingestion responsibility, (c) the original Craigslist/Fiverr/freelance-platform/ads channels as supplementary.
  - Recommendation section may flag "CSV ingestion tooling" as a candidate future Agent-Ready task without implementing it now (Research tasks don't implement, per standing rules).
  - The Modernizer categorization/LLM work referenced elsewhere (see #3) is separate and not yet built — don't conflate with the market-discovery pipeline, which is a different (also not-yet-built) part of that repo.

## Decisions (human only, do not attempt)

- [ ] #12 [stack: solo] Should project type move into advanced request options and be intelligently selected?
- [ ] #13 [stack: solo] Client acquisition calls: Alec, Kelly, one more Edgehill contact (James?).

## Discovered

<!-- Agent: add newly discovered work here during sessions, one line + location. Do not implement in the same session. -->
