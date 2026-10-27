import { GraphQLError } from 'graphql'

import { db } from '@/libs/DB'

import { hasSlugConflict } from './Project'

/**
 * **Server-only** (imports the database, so it is not in the `@/utils` barrel).
 *
 * Throws `DUPLICATE_SLUG` when another project already uses this name's slug.
 * Slugs are derived from project names and double as the project URL and the
 * provisioned repo name, so two projects must never share one.
 *
 * @param projectName - The name about to be used
 * @param excludeProjectId - A project to ignore, for renaming a project to its own slug
 */
export const assertProjectNameAvailable = async (
  projectName: string,
  excludeProjectId?: string
): Promise<void> => {
  const existingProjects = await db.query.projects.findMany({
    columns: { id: true, projectName: true },
  })

  if (!hasSlugConflict(projectName, existingProjects, excludeProjectId)) return

  throw new GraphQLError('A project with this name already exists', {
    extensions: { code: 'DUPLICATE_SLUG' },
  })
}
