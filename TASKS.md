# c0d3ster Tasks

Instructions for agent: This file is the task inventory only. Workflow rules (branching, PRs, testing, archival, NEEDS HUMAN annotations) live in CLAUDE.md under "Overnight Agent Workflow". Work through Agent-Ready tasks in order. Do not attempt Decisions items; those require human input.

Spec reference: docs/INVOICE_BILLING_EPIC.md defines the full invoicing pipeline across 7 phases with file locations, schemas, acceptance criteria, and implementation notes. Tasks below reference it by phase. If the doc and this file conflict, the doc wins; annotate the conflict here.

Invoice implementation rule (from doc): never hand-write migration SQL — edit the model then run db:generate. Never run db:migrate without explicit user approval; annotate NEEDS HUMAN when that step is reached.

## Agent-Ready

- [ ] #1 [stack: solo] Add file upload for existing projects.
  - Most plumbing already exists: `projectFiles` table (`src/models/files.ts`), `FileService.generateProjectFileUploadUrl`/`createProjectFileRecord`/`getProjectFiles` (`src/services/FileService.ts`), and a working two-step presigned-upload pattern in `FileResolver.ts:137-304` (`requestProjectLogoUpload`/`finalizeProjectLogoUpload`) — but that pair is logo-only today.
  - Add `caption` (text, nullable) and `placement` (new pgEnum, nullable) columns to `projectFiles` in `src/models/files.ts`; register the enum in `src/models/enums.ts`. Task doesn't specify placement values — use `gallery | document | other` as a reasonable default, confirm in PR.
  - Add `caption`/`placement` to `File`/`FileUploadInput` in `src/graphql/schema/files.ts`.
  - Add generic `requestProjectFileUpload`/`finalizeProjectFileUpload` mutations to `FileResolver.ts`, mirroring the logo pair but for arbitrary allowed content types, threading caption/placement through.
  - No authed "existing project detail" page exists yet (`app/(auth)/` only has `dashboard`, `dashboard/request-project`, `dashboard/project-requests/[id]`, `dashboard/user-profile`). Recommend adding `app/(auth)/dashboard/projects/[id]/page.tsx` as the upload UI's home — implementation judgment call, not a blocker.
  - Storage: keep the existing R2 key-prefix convention (`{env}/projects/{projectId}/...` in the shared bucket) rather than provisioning per-project buckets or writing into a client's deployed repo (different system entirely). Document the choice in the PR per the task's own instruction.
  - Acceptance: an authorized user can upload a file to an existing project, unauthorized users cannot (mirror the access-check pattern in `FileResolver.ts:74-91`), caption/placement persist.
  - NEEDS HUMAN: run `db:migrate` after `db:generate`.

- [ ] #2 [stack: invoicing] Add "features" as advanced request options (enum), collapsed by default in the request form. Per docs/INVOICE_BILLING_EPIC.md Phase 1: also expand the ProjectFeature enum with the new values listed there and create featurePricing.ts mapping each feature to { label, defaultPrice, description }.
  - Expand `ProjectFeature` enum in `src/graphql/schema/project.ts:45-49` with: AdminDashboard, PaymentProcessing, FileUploads, CustomApi, Deployment, DomainConfig, Seo, CmsIntegration, ResponsiveDesign, ThirdPartyIntegrations, Analytics, Testing, Consultation, ProjectManagement.
  - Path correction: doc says `src/lib/featurePricing.ts`; repo convention is `src/libs/` (see `src/libs/projectTypeFeatures.ts`, `DB.ts`, `Env.ts`) — use `src/libs/featurePricing.ts`.
  - `featurePricing.ts` needs one `defaultPrice` number per feature; doc only gives ranges (see Market Research table in the epic doc) — use the midpoint, rounded to nearest $25.
  - Doc discrepancy: the doc says "update DB enum" for Phase 1, but `ProjectFeature` isn't a Postgres enum (`projects.features` is a `json()` column — no `projectFeatureEnum` exists in `enums.ts`). No migration needed for the enum itself.
  - What does need a migration: `projectRequests` table (`src/models/projects.ts`) has no `features` column today, and `CreateProjectRequestInput`/`ProjectRequest` in `src/graphql/schema/projectRequest.ts` have no `features` field either. Add `features: json(...).$type<ProjectFeature[]>()` to the table and the field to both GraphQL types; persist it in `ProjectRequestService.createProjectRequest`.
  - Missing acceptance criteria: `ProjectRequestService.approveProjectRequest` (line 299) currently always calls `getDefaultFeatures(request.projectType)` — update it to prefer the client's explicit `request.features` when present, falling back to `getDefaultFeatures` otherwise.
  - Add a collapsed-by-default "Advanced Options" checkbox section to `ProjectRequestForm.tsx` (mirror the existing Requirements checkboxes at lines 291-326). Use enum labels only — never import `featurePricing.ts` client-side (standing constraint from the doc: it's admin-only, never client-facing).
  - Acceptance (from doc Phase 1 + above): `db:generate` succeeds; all new enum values visible; `featurePricing.ts` covers every enum value, imported only by `InvoiceService` (added in #5); existing Database/Auth/Email values unchanged; features render as a collapsed advanced section; selections persist with the request.
  - NEEDS HUMAN: approve `db:migrate` for the new `project_requests.features` column.

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

---

## Archive stub

The following Verify tasks were confirmed complete before this file was created (2026-07-13):

- [x] Admin request panel default sort excludes approved requests. ✓ confirmed.
- [x] Favorite star fixed right below header; login hover fixed. ✓ confirmed.
