# PRD: Lead Map

Status: draft, 2026-11-23. Owner: c0d3ster admin. First market: Virginia (Virginia Beach first, then Hampton Roads and Winchester).

Inputs this builds on:

- the-modernizer `docs/lead-map-research.md` (open PR c0d3ster/the-modernizer#40): integration options, data contract, map stack. This PRD adopts its recommendation (option A) and does not repeat the full comparison.
- the-modernizer `docs/market-discovery.md`: Places discovery, composite score, CSV contracts.
- Linear C0D-8 (handoff design) and C0D-5 (acquisition channels). This PRD answers most of C0D-8's questions; see "Linear mapping".

## Problem

The Modernizer can find local businesses and score how dated their sites are, but its output is three CSVs on a laptop. c0d3ster, where leads turn into project requests, projects and invoices, knows nothing about them. There is no way to see leads by location, plan a day of in-person visits, track who was pitched, or turn a won lead into a client.

## Goals

1. See every scored, greenfield and unreachable lead for a city on a map, ranked by how good a prospect it is.
2. Work a city in person from a phone: near me, tap to call, directions, set a status, write a note.
3. Re-scan a city without losing visit history (upsert on Google `place_id`).
4. Turn a won lead into a c0d3ster project request with its score and detected features carried over.
5. Keep discovery costs visible per run.

## Non-goals (v1)

- Starting scans from the website (option B in the research doc). Runs stay a local CLI.
- Automated email or SMS outreach. The Modernizer's outreach package (its task #9) and deliverability decisions stay separate.
- Multi-user sales teams, assignment, or territories.
- Showing scores or the map to clients. Admin only.
- Making The Modernizer a standalone product.

## Users

- **Admin (you)**, on a laptop to plan a city and on a phone while walking it.
- Later, possibly a `developer` helping with outreach (open question).

## How leads are discovered (the-modernizer)

Already built in the-modernizer (`scripts/discover-candidates.ts`, merged plus open PRs #35 and #39):

- **Source:** Google Places API (New) Text Search, one query per vertical per city (`"plumber Virginia Beach VA"`), up to 60 results per query, deduped by `place_id`. Field mask includes website, rating, review count, phone, address and, with #39, `places.location` for lat/lng at no extra request.
- **Output:** `candidates.csv` (has a site, scored), `greenfield-leads.csv` (no site), `unreachable.csv` (site failed to load).

Needed before a big-city run: split queries by ZIP or neighborhood (or a location-bias grid), because 60 results per query misses most businesses in a city of about 450,000.

Sources considered:

| Source | Role | Cost | Verified? |
|---|---|---|---|
| Google Places API (New) Text Search | Primary | the-modernizer doc says about $0.017 per request with a $200/month credit | **Unverified and likely stale.** Google replaced the flat $200 credit with per-SKU free monthly caps in March 2025, and website, phone and rating fields put requests in the Enterprise tier. Check current Text Search Enterprise pricing before a ZIP-split run, which multiplies request count by the number of ZIPs. |
| Yelp Fusion | Fallback for restaurants | doc says 500 requests/day free | Unverified; Search does not return the website, needs a Details call per business. |
| SerpAPI | Fallback if Places website coverage is poor | doc says about $50/month for 5,000 searches | Unverified. Deferred (the-modernizer Decisions). |
| OpenStreetMap (Overpass) | Not used in v1 | Free | Business coverage and website tags are sparse for small local businesses; possible free supplement later. |

## How each site is scored (the-modernizer)

Reuse as is. No scoring logic moves into c0d3ster.

- **Composite score** (`computeFinalScore`, PR #35), 0 to 100, lower is a better prospect. Weights (`COMPOSITE_WEIGHTS` in `@modernizer/schema`): visual 0.5, static v2 0.1, PSI code 0.1, SEO 0.1, accessibility 0.1, best practices 0.1. Missing signals drop out and the rest are reweighted. `pitch = score < 81` (`PITCH_THRESHOLD`, calibrated on the Site Rating Bench).
- **Visual score** comes from `packages/design-guide` (rubric and per-vertical profiles, 100-point deductions) applied to Playwright screenshots by `packages/discovery/src/visual-score`. It is the one LLM step in scoring.
- **Detected features** (`detectProjectFeatures`: booking, chat, reviews) map onto c0d3ster's project features (see open PR c0d3ster#113), so a lead arrives pre-filled.
- **Crawl budget:** homepage plus the browser inspection only, not a full-site crawl. Full crawl and extraction happen only for a lead worth a demo (see Outreach handoff).
- **Cost and time** (from the research doc, not yet measured on a ZIP-split run): about $0.03 per site for visual scoring, so about $9 for 300 sites; PSI is free with a key (25,000 queries/day per the-modernizer doc) but dominates wall-clock; plan on one to two hours per large-city run.

## Data model (c0d3ster, Drizzle)

Schema described only. Per CLAUDE.md: edit `src/models/**`, then `pnpm db:generate`, rename the migration, fix the journal tag, `pnpm db:migrate`. New file `src/models/leads.ts`, exported from `src/models/index.ts`. Enums derive from type-graphql enums in `src/graphql/schema/lead.ts`, like the existing ones in `src/models/enums.ts`.

**Enums**

- `lead_kind`: `scored`, `greenfield`, `unreachable`
- `lead_status`: `new`, `visited`, `pitched`, `follow_up`, `won`, `not_interested`, `do_not_contact`

**`discovery_runs`**

| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| external_run_id | varchar unique | the-modernizer `runId`, e.g. `virginia-beach-va-2026-11-24`; makes re-push idempotent |
| city, state | varchar | |
| ran_at | timestamp | |
| pitch_threshold | integer | stored per run so old scores keep their meaning |
| schema_version | integer | payload `version` |
| lead_count, pitch_count, greenfield_count, unreachable_count | integer | |
| cost_usd | decimal(10,2) | model spend reported by the run, nullable |
| pushed_by | uuid fk users | the admin the ingest token maps to |
| created_at | timestamp | |

**`leads`**

| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| place_id | varchar unique | upsert key |
| name, vertical, phone, address, city, state | varchar | |
| url | text, nullable | null for greenfield |
| latitude, longitude | double precision, nullable | index on (latitude, longitude); PostGIS not needed at this scale |
| kind | lead_kind | latest run's view |
| review_count | integer | |
| rating | decimal(2,1), nullable | |
| score | decimal(5,2), nullable | latest composite |
| pitch | boolean, nullable | |
| signals | json | latest breakdown (`visual`, `staticV2`, `code`, `seo`, `accessibility`, `bestPractices`, `performance`) |
| detected_features | json | `ProjectFeature[]`-compatible |
| notes | text | machine notes from the run, e.g. `no_ssl` |
| screenshot_file_id | uuid fk files, nullable | R2 via `FileService` |
| status | lead_status, default `new` | denormalized from latest activity for fast filters |
| first_seen_run_id, last_seen_run_id | uuid fk discovery_runs | |
| project_request_id | uuid fk project_requests, nullable | set on conversion |
| created_at, updated_at | timestamp | `$onUpdate` like other tables |

**`lead_scores`** (history): id, lead_id fk, run_id fk, score, pitch, signals json, created_at. Unique (lead_id, run_id).

**`lead_activity`**: id, lead_id fk, status, note text, created_by fk users, created_at. Append only; the latest row sets `leads.status`.

Re-import rule: an upsert updates the latest-score fields and appends a `lead_scores` row, never touches `status` or activity. A lead missing from a later run stays (it may have closed; mark stale in a later version).

## Ingest (handoff contract)

- the-modernizer defines `DiscoveryRunExport` (zod, `@modernizer/schema`, version 1, shape in the research doc) and adds `pnpm push-run <dir>` that builds it from a run's CSVs and POSTs it.
- c0d3ster adds a route handler `src/app/api/discovery/runs/route.ts` (not GraphQL: bulk upload, and the CLI stays free of Apollo). It checks `Authorization: Bearer <DISCOVERY_INGEST_TOKEN>` in a new `LeadService`, validates with a vendored copy of the zod schema, and upserts in one transaction.
- Screenshots: optional second step, `POST /api/discovery/runs/:id/screenshots` per lead, stored through `FileService` to R2. v1 can skip them.
- Fallback for the first trip if the page is not ready: import `candidates.csv` (pitch only) and `greenfield-leads.csv` into Google My Maps as two layers.

## Map UI (c0d3ster)

- **Route:** `src/app/(auth)/dashboard/leads/page.tsx`, plus `leads/[id]` for a full detail page. Nav item shown only for `admin`/`super_admin`; resolvers and the service call `UserService.checkPermission(user, 'admin')`.
- **Data:** GraphQL `leads(filter)` and `discoveryRuns` queries, `setLeadStatus(leadId, status, note)` and `convertLeadToProjectRequest(leadId)` mutations, through `src/apiClients/leadApiClient.ts`, then `pnpm codegen`.
- **Library:** MapLibre GL JS via `react-map-gl/maplibre`, OpenFreeMap tiles (no key; confirm usage terms before launch), MapTiler free tier as backup. Native clustering from a GeoJSON source, no per-load billing. Rejected: Google Maps JS and Mapbox (per-load billing, keys), Leaflet (weaker clustering and vector styling at thousands of points).
- **Markers** (color-blind safe, readable in sunlight):

| Lead | Shape | Color | Size |
|---|---|---|---|
| Pitch (score < threshold) | filled circle | yellow at 80 to deep red at 0 | grows as score drops |
| Greenfield | diamond | green, darker with more reviews | grows with reviews |
| Unreachable | hollow ring | orange | medium |
| Above threshold | small dot | faded gray, hidden by default | small |

  A status badge (visited, won, do not contact) sits on the marker.
- **Phone:** near me (geolocation, list sorted by distance), bottom sheet on tap with name, score, top three problems in plain words, tap to call, Directions (opens Google or Apple Maps), status buttons and a note field.
- **Filters:** run, vertical, kind, score range, status, not visited yet. List view under the map sorted by priority (lowest score, then review count).

## Pipeline and where the Modernizer runs

| Step | Runs where | Cost |
|---|---|---|
| Discover (Places) | the-modernizer CLI, laptop | Places requests, see pricing caveat |
| Score (static, PSI, visual) | the-modernizer CLI, laptop, Playwright | about $0.03 per site (visual LLM) |
| Push | the-modernizer CLI to c0d3ster route | free |
| Map, status, conversion | c0d3ster on Vercel | free tiles |
| Demo for a chosen lead | the-modernizer CLI, on demand | `--local` $0; `--claude` prints its own cost; Lovable uses Lovable credits |

Why not run scans inside c0d3ster now: a city run takes one to two hours, launches Chromium and spends API money, a poor fit for Vercel functions. A later job runner (queue plus a worker running the same CLI and pushing to the same endpoint) can add a "scan this city" button without changing the contract.

## Outreach handoff

- **Scored leads:** from the detail panel, "Generate demo" shows the exact CLI command (`pnpm modernize <url> --local`, or the Lovable mode). v1 is copy and run; a later version can store the generated preview URL on the lead. The pitch is the current-site screenshot next to the modernized home page, using the per-vertical framing in `docs/market-discovery.md` (trades: more leads from Google; professional services: credibility and trust).
- **Greenfield leads:** no demo possible; show similar past work. Framing: your competitors are findable online and you are not.
- **Conversion:** "Convert" creates a `project_requests` row with `projectName` from the business, `features` from `detected_features`, and the score summary in `additionalInfo`, then links `leads.project_request_id`. `project_requests.user_id` is required, so v1 creates the request under the admin and reassigns it when the business owner signs up (open question).
- **Compliance:** cold-calling business numbers is allowed in general, but texting or autodialed calls to mobile numbers need consent under the TCPA, and Virginia has its own telephone solicitation law. Not verified for this use; get a quick legal check before any calling or texting campaign. `do_not_contact` is a hard status that hides call buttons. In-person visits carry no such constraint.

## Milestones

**M0: Trip fallback (now).** Run Virginia Beach with coordinates (#39 merged), import into Google My Maps. No code in c0d3ster.

**M1: Handoff contract.** the-modernizer: ZIP split, `DiscoveryRunExport`, `push-run`. c0d3ster: tables, `LeadService`, ingest route. Answers C0D-8.

**M2: Map MVP.** Admin `dashboard/leads` page, markers, filters, detail sheet, near me, status and notes.

**M3: Conversion and pitch.** Convert to project request, demo command and stored preview link, screenshots in R2.

**M4: Later.** Scans from the website via a worker, re-scan cadence, stale leads, more markets.

## Linear mapping

| Issue | Status | How it relates |
|---|---|---|
| C0D-8 Design the Modernizer greenfield-leads handoff | Backlog, High | Superseded in scope by this PRD plus the research doc: transport (push to route), ingestion (zod validation), dedupe (`place_id`), data model, ownership are decided here. Remaining open part: compliance detail. Suggest closing it as done by this PRD, or narrowing it to compliance. Note it predates scored leads: the handoff now covers all three CSVs, not only greenfield. |
| C0D-5 Research client acquisition channels | Backlog, High | Related. Keep the channel survey; link this PRD for the Modernizer lead source instead of re-researching it. |
| C0D-7 Stripe refunds and disputes | Backlog | Unrelated. |
| C0D-6 Hero video | Backlog | Unrelated. |
| c0d3ster PR #113 project features | Open | Needed for `detected_features` to map cleanly on conversion (M3). |
| the-modernizer PRs #35, #39, #40 | Open | #35 composite score and #39 coordinates are hard prerequisites for M0/M1; #40 is the research input. |

No Linear project exists for this yet. Under nightlight's Linear mode, milestones need a Project; suggest a "Lead Map" project with M1 to M3 as milestones.

## Proposed new issues (not created)

c0d3ster (team C0D):

1. **Add lead and discovery run tables.** Acceptance: `src/models/leads.ts` defines `discovery_runs`, `leads`, `lead_scores`, `lead_activity` and the two enums as above; marked NEEDS HUMAN for migration.
2. **Add `LeadService` with idempotent run ingest.** Acceptance: pushing the same payload twice leaves one run and unchanged lead counts; a second run appends `lead_scores` and keeps statuses; unit tests cover both.
3. **Add `/api/discovery/runs` ingest route with token auth.** Acceptance: rejects a missing or wrong `DISCOVERY_INGEST_TOKEN` with 401 and an invalid payload with 400; valid payload calls `LeadService`.
4. **Add lead GraphQL schema, resolvers and `leadApiClient`.** Acceptance: admin-only `leads(filter)`, `discoveryRuns`, `setLeadStatus`; non-admin gets a permission error; codegen committed.
5. **Build admin lead map page.** Acceptance: `dashboard/leads` renders MapLibre with clustered markers per the marker table, filters, and admin-only nav; works at phone width.
6. **Lead detail sheet with near me, call, directions and status.** Acceptance: tapping a marker shows score, top problems, tel link, maps link, status buttons; status change persists and updates the badge.
7. **Convert a lead to a project request.** Acceptance: creates a `project_requests` row with features and score summary, links it on the lead, and refuses a second conversion.
8. **Store lead screenshots in R2.** Acceptance: optional screenshot upload per lead through `FileService`, shown in the detail sheet.

the-modernizer (local TASKS.md):

9. **Split Places queries by ZIP or neighborhood for large cities.** Acceptance: a city config with ZIPs runs one query per vertical per ZIP, dedupes by `place_id`, and stops paging when a page is empty.
10. **Add `DiscoveryRunExport` schema and `push-run` command.** Acceptance: zod schema v1 in `@modernizer/schema`; `pnpm push-run <dir>` builds it from a run's CSVs and POSTs to a configured URL with the token; `--dry-run` writes `leads.json`.
11. **Verify current Places API (New) pricing and update `docs/market-discovery.md`.** Acceptance: doc states the current Enterprise-tier Text Search price and free cap with a source link, and an estimated cost for a ZIP-split Virginia Beach run.

## Open questions

1. Does the business owner get a c0d3ster account at conversion, or does the request stay under the admin until they sign up?
2. Store screenshots in R2, or link to local files only?
3. Is the visual "why this looks dated" note shown to the business in a pitch, or kept internal?
4. Who else gets access: only you, or developers doing outreach?
5. Re-scan cadence: on demand per city, or periodic?
6. Which Virginia markets after Virginia Beach, and in what order?
7. Legal check on calling and texting rules before any phone campaign.
8. Close C0D-8 as answered by this PRD, or narrow it to compliance?
