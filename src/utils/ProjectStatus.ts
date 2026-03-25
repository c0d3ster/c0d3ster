/**
 * Server-only **project status** helpers (schema / DB enum values).
 *
 * Imports `@/graphql/schema` (type-graphql). Must never be imported from client
 * components or it will pull Node/type-graphql into the browser bundle.
 *
 * `import 'server-only'` makes Next fail the build if this file is imported from a
 * Client Component or shared client bundle.
 *
 * For **display** helpers (labels, icons, CSS) that run in the browser, use
 * `@/utils/Project` instead — that module uses generated GraphQL types only.
 */
import 'server-only'

import { ProjectStatus } from '@/graphql/schema'

const DB_STATUS_VALUES = new Set(Object.values(ProjectStatus) as string[])

/**
 * Coerces status strings from clients (e.g. GraphQL codegen using enum keys like
 * "InReview") to the canonical DB / enum values (e.g. "in_review").
 */
export function normalizeProjectStatusInput(status: string): ProjectStatus {
  if (DB_STATUS_VALUES.has(status)) {
    return status as ProjectStatus
  }
  const fromKey = ProjectStatus[status as keyof typeof ProjectStatus]
  if (typeof fromKey === 'string' && DB_STATUS_VALUES.has(fromKey)) {
    return fromKey as ProjectStatus
  }
  throw new Error(`Invalid project status: ${status}`)
}
