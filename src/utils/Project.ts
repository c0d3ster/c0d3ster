/**
 * Utility functions for handling project slugs and status
 */

/**
 * Generates a URL-friendly slug from a project name
 * @param projectName - The project name to convert to a slug
 * @returns A URL-friendly slug
 */
export const generateSlug = (projectName: string): string => {
  return projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Checks if a generated slug would conflict with existing project slugs
 * @param projectName - The project name to check
 * @param existingProjects - Array of existing projects to check against
 * @param excludeProjectId - Optional project ID to exclude from the check (for updates)
 * @returns True if there's a slug conflict, false otherwise
 */
export const hasSlugConflict = (
  projectName: string,
  existingProjects: Array<{ id: string; projectName: string }>,
  excludeProjectId?: string
): boolean => {
  const newSlug = generateSlug(projectName)

  return existingProjects.some((project) => {
    // Skip the project being updated
    if (excludeProjectId && project.id === excludeProjectId) {
      return false
    }

    const existingSlug = generateSlug(project.projectName)
    return existingSlug === newSlug
  })
}

/**
 * Finds a project by its slug
 * @param slug - The slug to search for
 * @param projects - Array of projects to search through
 * @returns The matching project or undefined if not found
 *
 * @todo Performance improvement: This is currently O(n) array search.
 * Consider adding a slug column to the database with a unique index
 * and querying directly by slug instead of scanning all projects.
 * This would improve performance and ensure slug uniqueness.
 */
export const findProjectBySlug = <T extends { projectName: string }>(
  slug: string,
  projects: T[]
): T | undefined => {
  return projects.find((project) => {
    const projectSlug = generateSlug(project.projectName)
    return projectSlug === slug
  })
}

/**
 * Formats project status for display (e.g., "in_progress" -> "IN PROGRESS")
 * @param status - The project status to format
 * @returns Formatted status string
 */
export const formatStatus = (status: string): string => {
  if (!status) return 'UNKNOWN'

  // Handle PascalCase by inserting spaces before capital letters
  return status
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .trim() // Remove leading space
    .toUpperCase()
}

/**
 * Gets CSS classes for styling project status
 * @param status - The project status
 * @returns CSS class string for styling
 */
export const getStatusStyling = (status: string | undefined | null): string => {
  if (!status) return 'text-gray-400'

  switch (status) {
    case 'Completed':
      return 'text-green-400'
    case 'InProgress':
    case 'InTesting':
    case 'ReadyForLaunch':
      return 'text-yellow-400'
    case 'Requested':
    case 'InReview':
    case 'Approved':
      return 'text-blue-400'
    case 'Cancelled':
      return 'text-red-400'
    case 'Live':
      return 'text-green-400'
    case 'OnHold':
      return 'text-gray-400'
    default:
      return 'text-gray-400'
  }
}

/**
 * Gets CSS classes for styling project status in cards/templates
 * @param status - The project status
 * @returns CSS class string for styling
 */
export const getStatusCardStyling = (
  status: string | undefined | null
): string => {
  if (!status) return 'border-gray-400/40 bg-gray-400/20 text-gray-400'

  switch (status) {
    case 'Completed':
      return 'border-green-400/40 bg-green-400/20 text-green-400'
    case 'InProgress':
    case 'InTesting':
    case 'ReadyForLaunch':
      return 'border-yellow-400/40 bg-yellow-400/20 text-yellow-400'
    case 'Requested':
    case 'InReview':
    case 'Approved':
      return 'border-blue-400/40 bg-blue-400/20 text-blue-400'
    case 'Cancelled':
      return 'border-red-400/40 bg-red-400/20 text-red-400'
    case 'Live':
      return 'border-green-400/40 bg-green-400/20 text-green-400'
    case 'OnHold':
      return 'border-gray-400/40 bg-gray-400/20 text-gray-400'
    default:
      return 'border-gray-400/40 bg-gray-400/20 text-gray-400'
  }
}
