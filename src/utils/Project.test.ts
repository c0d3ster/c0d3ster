import { describe, expect, it } from 'vitest'

import { ProjectStatus } from '@/graphql/generated/graphql'

import {
  findProjectBySlug,
  formatStatus,
  generateSlug,
  getStatusCardStyling,
  getStatusIcon,
  getStatusStyling,
  hasSlugConflict,
} from './Project'

describe('Project utilities', () => {
  describe('generateSlug', () => {
    it('should convert project name to URL-friendly slug', () => {
      expect(generateSlug('My Awesome Project')).toBe('my-awesome-project')
      expect(generateSlug('Project with Special Characters!@#')).toBe(
        'project-with-special-characters'
      )
      expect(generateSlug('Project   with   Multiple   Spaces')).toBe(
        'project-with-multiple-spaces'
      )
      expect(generateSlug('Project-With-Dashes')).toBe('project-with-dashes')
      expect(generateSlug('Project_With_Underscores')).toBe(
        'project-with-underscores'
      )
    })

    it('should handle edge cases', () => {
      expect(generateSlug('')).toBe('')
      expect(generateSlug('   ')).toBe('')
      expect(generateSlug('---')).toBe('')
      expect(generateSlug('123')).toBe('123')
      expect(generateSlug('Project!!!')).toBe('project')
    })
  })

  describe('hasSlugConflict', () => {
    const existingProjects = [
      { id: '1', projectName: 'Existing Project' },
      { id: '2', projectName: 'Another Project' },
      { id: '3', projectName: 'Third Project' },
    ]

    it('should detect slug conflicts', () => {
      expect(hasSlugConflict('Existing Project', existingProjects)).toBe(true)
      expect(hasSlugConflict('existing project', existingProjects)).toBe(true)
      expect(hasSlugConflict('EXISTING PROJECT', existingProjects)).toBe(true)
    })

    it('should not detect conflicts for different projects', () => {
      expect(hasSlugConflict('New Project', existingProjects)).toBe(false)
      expect(hasSlugConflict('Completely Different', existingProjects)).toBe(
        false
      )
    })

    it('should exclude project when updating', () => {
      expect(hasSlugConflict('Existing Project', existingProjects, '1')).toBe(
        false
      )
      expect(hasSlugConflict('Another Project', existingProjects, '2')).toBe(
        false
      )
    })

    it('should handle empty arrays', () => {
      expect(hasSlugConflict('Any Project', [])).toBe(false)
    })
  })

  describe('findProjectBySlug', () => {
    const projects = [
      { id: '1', projectName: 'First Project' },
      { id: '2', projectName: 'Second Project' },
      { id: '3', projectName: 'Third Project' },
    ]

    it('should find project by slug', () => {
      expect(findProjectBySlug('first-project', projects)).toEqual(projects[0])
      expect(findProjectBySlug('second-project', projects)).toEqual(projects[1])
      expect(findProjectBySlug('third-project', projects)).toEqual(projects[2])
    })

    it('should return undefined for non-existent slug', () => {
      expect(findProjectBySlug('non-existent', projects)).toBeUndefined()
      expect(findProjectBySlug('', projects)).toBeUndefined()
    })

    it('should handle empty arrays', () => {
      expect(findProjectBySlug('any-slug', [])).toBeUndefined()
    })
  })

  describe('formatStatus', () => {
    it('should format status strings correctly', () => {
      expect(formatStatus('inProgress')).toBe('IN PROGRESS')
      expect(formatStatus('readyForLaunch')).toBe('READY FOR LAUNCH')
      expect(formatStatus('inReview')).toBe('IN REVIEW')
      expect(formatStatus('completed')).toBe('COMPLETED')
    })

    it('should handle empty or null values', () => {
      expect(formatStatus('')).toBe('UNKNOWN')
      expect(formatStatus(null as any)).toBe('UNKNOWN')
      expect(formatStatus(undefined as any)).toBe('UNKNOWN')
    })
  })

  describe('getStatusIcon', () => {
    it('should return correct icons for each status', () => {
      expect(getStatusIcon(ProjectStatus.Requested)).toBe('⏳')
      expect(getStatusIcon(ProjectStatus.InReview)).toBe('👀')
      expect(getStatusIcon(ProjectStatus.Approved)).toBe('👍')
      expect(getStatusIcon(ProjectStatus.InProgress)).toBe('🚧')
      expect(getStatusIcon(ProjectStatus.InTesting)).toBe('🧪')
      expect(getStatusIcon(ProjectStatus.ReadyForLaunch)).toBe('🚀')
      expect(getStatusIcon(ProjectStatus.Completed)).toBe('✅')
      expect(getStatusIcon(ProjectStatus.Cancelled)).toBe('❌')
    })

    it('should return question mark for unknown status', () => {
      expect(getStatusIcon('unknown')).toBe('❓')
      expect(getStatusIcon(null)).toBe('❓')
      expect(getStatusIcon(undefined)).toBe('❓')
    })
  })

  describe('getStatusStyling', () => {
    it('should return correct CSS classes for each status', () => {
      expect(getStatusStyling(ProjectStatus.Completed)).toBe('text-green-400')
      expect(getStatusStyling(ProjectStatus.InProgress)).toBe('text-yellow-400')
      expect(getStatusStyling(ProjectStatus.InTesting)).toBe('text-yellow-400')
      expect(getStatusStyling(ProjectStatus.ReadyForLaunch)).toBe(
        'text-yellow-400'
      )
      expect(getStatusStyling(ProjectStatus.Requested)).toBe('text-purple-400')
      expect(getStatusStyling(ProjectStatus.InReview)).toBe('text-blue-400')
      expect(getStatusStyling(ProjectStatus.Approved)).toBe('text-blue-400')
      expect(getStatusStyling(ProjectStatus.Cancelled)).toBe('text-red-400')
    })

    it('should return gray for unknown status', () => {
      expect(getStatusStyling('unknown')).toBe('text-gray-400')
      expect(getStatusStyling(null)).toBe('text-gray-400')
      expect(getStatusStyling(undefined)).toBe('text-gray-400')
    })
  })

  describe('getStatusCardStyling', () => {
    it('should return correct CSS classes for card styling', () => {
      expect(getStatusCardStyling(ProjectStatus.Completed)).toBe(
        'border-green-400/40 bg-green-400/20 text-green-400'
      )
      expect(getStatusCardStyling(ProjectStatus.InProgress)).toBe(
        'border-yellow-400/40 bg-yellow-400/20 text-yellow-400'
      )
      expect(getStatusCardStyling(ProjectStatus.InTesting)).toBe(
        'border-yellow-400/40 bg-yellow-400/20 text-yellow-400'
      )
      expect(getStatusCardStyling(ProjectStatus.ReadyForLaunch)).toBe(
        'border-yellow-400/40 bg-yellow-400/20 text-yellow-400'
      )
      expect(getStatusCardStyling(ProjectStatus.Requested)).toBe(
        'border-purple-400/40 bg-purple-400/20 text-purple-400'
      )
      expect(getStatusCardStyling(ProjectStatus.InReview)).toBe(
        'border-blue-400/40 bg-blue-400/20 text-blue-400'
      )
      expect(getStatusCardStyling(ProjectStatus.Approved)).toBe(
        'border-blue-400/40 bg-blue-400/20 text-blue-400'
      )
      expect(getStatusCardStyling(ProjectStatus.Cancelled)).toBe(
        'border-red-400/40 bg-red-400/20 text-red-400'
      )
    })

    it('should return gray for unknown status', () => {
      expect(getStatusCardStyling('unknown')).toBe(
        'border-gray-400/40 bg-gray-400/20 text-gray-400'
      )
      expect(getStatusCardStyling(null)).toBe(
        'border-gray-400/40 bg-gray-400/20 text-gray-400'
      )
      expect(getStatusCardStyling(undefined)).toBe(
        'border-gray-400/40 bg-gray-400/20 text-gray-400'
      )
    })
  })
})
