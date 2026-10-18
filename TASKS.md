# c0d3ster Tasks

Instructions for agent: This file is the task inventory only. Workflow rules (branching, PRs, testing, archival, NEEDS HUMAN annotations) live in CLAUDE.md under "Overnight Agent Workflow". Work through Agent-Ready tasks in order. Do not attempt Decisions items; those require human input.

Spec reference: docs/INVOICE_BILLING_EPIC.md defines the full invoicing pipeline across 7 phases with file locations, schemas, acceptance criteria, and implementation notes. Tasks below reference it by phase. If the doc and this file conflict, the doc wins; annotate the conflict here.

Invoice implementation rule (from doc): never hand-write migration SQL — edit the model then run db:generate. Never run db:migrate without explicit user approval; annotate NEEDS HUMAN when that step is reached.

## Agent-Ready

- [ ] #10 [stack: solo] Hero video for home page ("Power up your project today"): circuitry + logo-formation effect, no video asset needed.
  - Reconsidered from the original "Kaiber video" framing after reviewing the brand reference image (navy background, cyan PCB-style circuit traces radiating outward, green "c0d3ster" wordmark, green circular power-icon mark). Both effects the task wanted (circuitry, wordmark forming/shrinking into the corner logo) are achievable in pure CSS/SVG — no video, no external asset, no NEEDS HUMAN blocker.
  - New SVG circuit-trace background component (e.g. `src/components/atoms/CircuitBackground.tsx`), hand-authored paths radiating outward with node-dot accents matching the reference image's PCB style. Optionally animate traces drawing in on mount via `stroke-dasharray`/`stroke-dashoffset` — fits the existing terminal/typewriter "booting up" motif already in `HeroSection.tsx`.
  - Open call: the reference image uses navy/cyan/green; the site's current theme is monochrome green-on-black throughout (`HeroSection.tsx`, `SiteHeader.tsx`). Recommend dim green traces for palette consistency rather than introducing blue — adjustable in the PR, not a blocker either way.
  - Shrink-into-corner effect: `SiteHeader.tsx` already renders the real logo (`LOGO_PATH`) top-left (`SiteHeader.tsx:279-287`) and already fades it in on scroll over a `50px → 225px` window (`SiteHeader.tsx:147-153`). Extend `HeroSection.tsx`'s existing `scrollY`-driven transform (already used for the side matrix bars, lines 26-39) to scale/translate the "c0d3ster" wordmark toward the top-left, timed to match the header's fade-in window exactly — the hero mark visually shrinks away just as the real header logo fades in. Pure CSS transform sync between two components, no DOM reparenting, no asset needed.
  - Acceptance (revised, replaces original video-dependent criteria): circuit background renders behind hero content; wordmark shrinks/translates toward the header logo position in sync with the header's existing fade-in; no layout regressions on mobile; entirely CSS/SVG, no video file added.
- [ ] #15 [stack: solo] Handle Stripe refunds and disputes so invoice and project amounts follow Stripe.
  - Gap, confirmed in code: `src/app/api/webhooks/stripe/route.ts` only handles `checkout.session.completed`; `InvoiceService.recordPayment` only adds to `paidAmount`. A refund or chargeback in Stripe leaves the invoice `paid`/`partially_paid` and `project.paidAmount` unchanged.
  - Handle `charge.refunded` (full and partial; use the cumulative `amount_refunded`) and `charge.dispute.created` / `charge.dispute.closed`. Resolve the invoice via the PaymentIntent metadata (`invoiceId` is already set in `payment_intent_data.metadata` by the checkout route); retrieve the PaymentIntent if the charge doesn't carry it.
  - Reduce `paidAmount` and re-derive status (`paid` -> `partially_paid` -> `sent`), then resync `project.paidAmount` as the sum of that project's invoice `paidAmount`s, all in one row-locked transaction like `recordPayment`.
  - Design decision: `STATUS_TRANSITIONS` in `InvoiceService.ts` treats `Paid` and `Cancelled` as terminal, so refunds need an explicit reverse path. Also only the last `stripeCheckoutSessionId` is stored per invoice, so idempotency for refund events needs its own record (for example store processed refund/dispute ids, or add a payments ledger table; the latter needs a migration per CLAUDE.md).
  - Acceptance: a full refund and a partial refund in Stripe test mode each update the invoice and project amounts correctly; replaying the same event changes nothing; a dispute opened/closed is reflected and logged; unit tests cover signature rejection, replay, partial, full, and unknown invoice.
  - NEEDS HUMAN: add `charge.refunded`, `charge.dispute.created` and `charge.dispute.closed` to the live Stripe webhook destination (and `stripe listen` covers them locally); approval before any `db:migrate`.

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
