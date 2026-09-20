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
