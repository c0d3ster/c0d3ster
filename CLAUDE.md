# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A dev-agency/client platform: it showcases the author's work and lets prospective clients request projects. `GitHubService` and `VercelService` provision real client repos (from a template repo) and Vercel deployments — this is core product functionality, not incidental tooling.

## Commands

```bash
npm run dev                 # next dev --turbopack + codegen:watch in parallel
npm run build:ci            # next build only (what CI runs)
npm run build:prod          # production build (scripts/build.js)

npm run test                # vitest run (all projects)
npx vitest run path/to/File.test.ts        # single file
npx vitest run -t "test name"              # single test by name
npm run test:coverage
npm run test:e2e            # Playwright

npm run lint / lint:fix
npm run format / format:check
npm run check:types         # tsc --noEmit
npm run check:deps          # knip — unused deps/exports

npm run db:generate / db:migrate / db:studio   # Drizzle
npm run codegen / codegen:watch                # regenerate GraphQL client types — run after any change to src/graphql/schema/* or a gql operation in src/apiClients/*
```

See DEVELOPMENT.md for env var setup and ARCHITECTURE.md for full diagrams.

## Architecture

Request flow (see ARCHITECTURE.md for the full diagram):

```
components (atoms/molecules/organisms/templates)
  → apiClients/*ApiClient.ts   (gql operations, wraps codegen'd Apollo hooks)
    → Apollo Client → src/app/api/graphql (Apollo Server route)
      → graphql/resolvers/*    (auth check, then delegates to a service)
        → services/*           (business logic + auth, Drizzle ORM, external APIs)
```

Adding a feature end-to-end touches: `graphql/schema` (type-graphql decorator class) → `graphql/resolvers` → `services` → `apiClients` (gql op) → `npm run codegen` to get the typed hook.

- **Auth/permissions are centralized in services**, not resolvers — `UserService.getCurrentUserWithAuth()` and `checkPermission()`. Resolvers call services directly; there is no separate repository/DAO layer.
- `src/graphql/generated` is gitignored and codegen-produced — never hand-edit.
- Path aliases: `@/*` → `src/*`, `@/public/*` → `public/*`, `@/tests/*` → `tests/*`.
- Route groups: `app/(auth)` = signed-in dashboard (project requests, user profile), `app/(public)` = marketing/project pages, plus `app/api` for GraphQL, Clerk webhooks, and user sync.
- `services/` includes provisioning integrations beyond CRUD: `GitHubService` (repo creation from template), `VercelService` (deployment provisioning), `NeonService` (DB provisioning), `FileService` (Cloudflare R2), `ContactService` (contact form → email via Resend).

## Testing

Vitest runs two projects (vitest.config.mts):
- **unit**: jsdom, `src/**/*.test.{js,ts,tsx}` (excludes `src/hooks/**`)
- **ui**: real headless Chromium via the Playwright provider, for `src/hooks/**/*.test.ts` only

E2E specs (`*.spec.ts`/`*.e2e.ts`) are excluded from `tsc` and from the vitest globs, and get relaxed lint rules (quotes) via `eslint.config.mjs`.

## Database migrations (Drizzle)

Schema changes (add/remove/alter a column, table, or enum):
1. Edit the schema in `src/models/**` first.
2. Run `npm run db:generate`. drizzle-kit diffs your change against `migrations/meta/*_snapshot.json` and writes a new `migrations/00XX_<random-words>.sql`, a matching snapshot, and a journal entry in `migrations/meta/_journal.json`.
3. Review the generated SQL.
4. Rename the file from drizzle-kit's random-word name to a short descriptive slug, keeping the numeric prefix (e.g. `0018_hazy_falcon.sql` -> `0018_add_invoice_status.sql`).
5. Update the matching entry's `"tag"` in `migrations/meta/_journal.json` to the new filename minus `.sql`. This is the step that gets skipped and breaks `db:migrate` (it looks up files by tag, not by number).
6. Run `npm run db:migrate`.

Data-only migrations (backfilling or renaming stored values, no column/type change):
- `db:generate` diffs `src/models/**` against the last snapshot. With no schema change there's nothing to diff, so it silently generates nothing. Don't try to force one through drizzle-kit for a pure data fix.
- If the fix is pure SQL, hand-write a numbered `.sql` file in `migrations/` and add its own `_journal.json` entry (reuse the prior snapshot unchanged, since the schema didn't move).
- If the fix needs to touch anything outside the DB in lockstep with a column update (e.g. renaming R2 object keys while updating the row that points at them), it can't be a migration file at all. Write a standalone script instead (see `scripts/`), reading credentials from env, not through Drizzle's migration system.

## Conventions enforced by tooling

- Commit messages must be Conventional Commits (commitlint + lefthook `commit-msg` hook); `semantic-release` on `main` drives GitHub releases from that history. Use `npm run commit` for an interactive prompt.
- lefthook `pre-commit` runs `eslint --fix` and `check:types` on staged files — don't bypass with `--no-verify`.
- ESLint (antfu config) enforces alphabetically-sorted imports and `type` over `interface` for type definitions — matches the global TypeScript style already in effect.
