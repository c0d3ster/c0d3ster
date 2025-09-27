import { GraphQLError } from 'graphql'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectStatus } from '@/graphql/schema'
import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import {
  findProjectBySlug,
  hasSlugConflict,
  isAdminRole,
  isDeveloperOrHigherRole,
} from '@/utils'

import { ProjectService } from './ProjectService'

// Mock FileService
const mockFileService = {
  deleteFile: vi.fn(),
  getFileMetadata: vi.fn(),
  createProjectFileRecord: vi.fn(),
}

// Mock specific dependencies not covered by global setup
vi.mock('@/utils', () => ({
  findProjectBySlug: vi.fn(),
  hasSlugConflict: vi.fn(),
  isAdminRole: vi.fn(),
  isDeveloperOrHigherRole: vi.fn(),
}))

describe('ProjectService', () => {
  let projectService: ProjectService
  const mockDbQuery = vi.mocked(db.query.projects)
  const mockDbQueryUsers = vi.mocked(db.query.users)
  const mockDbQueryStatusUpdates = vi.mocked(db.query.statusUpdates)
  const mockDbQueryProjectRequests = vi.mocked(db.query.projectRequests)
  const mockDbQueryProjectCollaborators = vi.mocked(
    db.query.projectCollaborators
  )
  const mockDbInsert = vi.mocked(db.insert)
  const mockDbUpdate = vi.mocked(db.update)
  const mockDbSelect = vi.mocked(db.select)
  const mockDbTransaction = vi.mocked(db.transaction)
  const mockLogger = vi.mocked(logger)
  const mockFindProjectBySlug = vi.mocked(findProjectBySlug)
  const mockHasSlugConflict = vi.mocked(hasSlugConflict)
  const mockIsAdminRole = vi.mocked(isAdminRole)
  const mockIsDeveloperOrHigherRole = vi.mocked(isDeveloperOrHigherRole)

  const mockProject = {
    id: 'project-123',
    clientId: 'client-123',
    developerId: 'developer-123',
    requestId: 'request-123',
    projectName: 'Test Project',
    title: 'Test Title',
    description: 'Test Description',
    projectType: 'WEB_APP',
    budget: 5000,
    requirements: ['Feature 1', 'Feature 2'],
    techStack: ['React', 'Node.js'],
    status: ProjectStatus.Approved,
    progressPercentage: 50,
    featured: false,
    logo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Add missing required properties
    overview: null,
    priority: 'medium',
    paidAmount: null,
    startDate: null,
    endDate: null,
    timeline: null,
    contactPreference: null,
    additionalInfo: null,
    slug: null,
    isPublic: false,
    githubRepo: null,
    liveUrl: null,
    estimatedCompletionDate: null,
    actualCompletionDate: null,
    repositoryUrl: null,
    stagingUrl: null,
    deploymentNotes: null,
    testingNotes: null,
    clientNotes: null,
    internalNotes: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    projectService = new ProjectService(mockFileService as any)
  })

  describe('getProjects', () => {
    it('should return all projects without filter', async () => {
      const mockProjects = [mockProject, { ...mockProject, id: 'project-456' }]
      mockDbQuery.findMany.mockResolvedValue(mockProjects)

      const result = await projectService.getProjects()

      expect(mockDbQuery.findMany).toHaveBeenCalled()
      expect(result).toEqual(mockProjects)
    })

    it('should return filtered projects by status', async () => {
      const mockProjects = [mockProject]
      mockDbQuery.findMany.mockResolvedValue(mockProjects)

      const result = await projectService.getProjects({
        status: ProjectStatus.Approved,
      })

      expect(result).toEqual(mockProjects)
    })

    it('should return projects filtered by client role', async () => {
      const mockProjects = [mockProject]
      mockDbQuery.findMany.mockResolvedValue(mockProjects)

      const result = await projectService.getProjects(
        undefined,
        'client-123',
        'client'
      )

      expect(result).toEqual(mockProjects)
    })

    it('should return projects filtered by developer role', async () => {
      const mockProjects = [mockProject]
      mockDbQuery.findMany.mockResolvedValue(mockProjects)

      const result = await projectService.getProjects(
        undefined,
        'developer-123',
        'developer'
      )

      expect(result).toEqual(mockProjects)
    })

    it('should return all projects for admin role', async () => {
      const mockProjects = [mockProject]
      mockDbQuery.findMany.mockResolvedValue(mockProjects)

      const result = await projectService.getProjects(
        undefined,
        'admin-123',
        'admin'
      )

      expect(result).toEqual(mockProjects)
    })
  })

  describe('getProjectById', () => {
    it('should return project when found and user has access', async () => {
      mockDbQuery.findFirst.mockResolvedValue(mockProject)

      const result = await projectService.getProjectById(
        'project-123',
        'client-123',
        'client'
      )

      expect(mockDbQuery.findFirst).toHaveBeenCalled()
      expect(result).toEqual(mockProject)
    })

    it('should throw error when project not found', async () => {
      mockDbQuery.findFirst.mockResolvedValue(undefined)

      await expect(
        projectService.getProjectById('project-123', 'client-123', 'client')
      ).rejects.toThrow(GraphQLError)
    })

    it('should allow admin access to any project', async () => {
      mockDbQuery.findFirst.mockResolvedValue(mockProject)
      mockIsAdminRole.mockReturnValue(true)

      const result = await projectService.getProjectById(
        'project-123',
        'other-user',
        'admin'
      )

      expect(result).toEqual(mockProject)
    })

    it('should throw access denied error for client accessing other project', async () => {
      const otherProject = { ...mockProject, clientId: 'other-client' }
      mockDbQuery.findFirst.mockResolvedValue(otherProject)
      mockIsAdminRole.mockReturnValue(false)

      await expect(
        projectService.getProjectById('project-123', 'client-123', 'client')
      ).rejects.toThrow(GraphQLError)
    })

    it('should throw access denied error for developer accessing other project', async () => {
      const otherProject = { ...mockProject, developerId: 'other-developer' }
      mockDbQuery.findFirst.mockResolvedValue(otherProject)
      mockIsAdminRole.mockReturnValue(false)

      await expect(
        projectService.getProjectById(
          'project-123',
          'developer-123',
          'developer'
        )
      ).rejects.toThrow(GraphQLError)
    })
  })

  describe('getProjectBySlug', () => {
    it('should return project when found by slug', async () => {
      const mockProjects = [mockProject]
      mockDbQuery.findMany.mockResolvedValue(mockProjects)
      mockFindProjectBySlug.mockReturnValue(mockProject)

      const result = await projectService.getProjectBySlug(
        'test-project',
        'client-123',
        'client'
      )

      expect(mockFindProjectBySlug).toHaveBeenCalledWith(
        'test-project',
        mockProjects
      )
      expect(result).toEqual(mockProject)
    })

    it('should throw error when project not found by slug', async () => {
      const mockProjects = [mockProject]
      mockDbQuery.findMany.mockResolvedValue(mockProjects)
      mockFindProjectBySlug.mockReturnValue(undefined)

      await expect(
        projectService.getProjectBySlug(
          'nonexistent-slug',
          'client-123',
          'client'
        )
      ).rejects.toThrow(GraphQLError)
    })

    it('should allow public access to c0d3ster projects', async () => {
      const c0d3sterUser = {
        id: 'c0d3ster-id',
        clerkId: 'clerk_c0d3ster',
        email: 'support@c0d3ster.com',
        firstName: null,
        lastName: null,
        avatarUrl: null,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const c0d3sterProject = { ...mockProject, clientId: 'c0d3ster-id' }

      mockDbQuery.findMany.mockResolvedValue([c0d3sterProject])
      mockFindProjectBySlug.mockReturnValue(c0d3sterProject)
      mockDbQueryUsers.findFirst.mockResolvedValue(c0d3sterUser)

      const result = await projectService.getProjectBySlug('test-project')

      expect(result).toEqual(c0d3sterProject)
    })

    it('should deny public access to non-c0d3ster projects', async () => {
      const c0d3sterUser = {
        id: 'c0d3ster-id',
        clerkId: 'clerk_c0d3ster',
        email: 'support@c0d3ster.com',
        firstName: null,
        lastName: null,
        avatarUrl: null,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const otherProject = {
        ...mockProject,
        clientId: 'other-client',
        developerId: 'other-dev',
      }

      mockDbQuery.findMany.mockResolvedValue([otherProject])
      mockFindProjectBySlug.mockReturnValue(otherProject)
      mockDbQueryUsers.findFirst.mockResolvedValue(c0d3sterUser)

      await expect(
        projectService.getProjectBySlug('test-project')
      ).rejects.toThrow(GraphQLError)
    })
  })

  describe('getMyProjects', () => {
    it('should return all projects for admin', async () => {
      const mockProjects = [mockProject]
      mockIsAdminRole.mockReturnValue(true)
      mockDbQuery.findMany.mockResolvedValue(mockProjects)

      const result = await projectService.getMyProjects('admin-123', 'admin')

      expect(result).toEqual(mockProjects)
    })

    it('should return user-specific projects for non-admin', async () => {
      const mockProjects = [mockProject]
      mockIsAdminRole.mockReturnValue(false)
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockProjects),
          }),
        }),
      } as any)

      const result = await projectService.getMyProjects('client-123', 'client')

      expect(result).toEqual(mockProjects)
    })
  })

  describe('getAvailableProjects', () => {
    it('should return available projects', async () => {
      const availableProjects = [{ ...mockProject, developerId: null }]
      mockDbQuery.findMany.mockResolvedValue(availableProjects)

      const result = await projectService.getAvailableProjects()

      expect(result).toEqual(availableProjects)
    })
  })

  describe('getFeaturedProjects', () => {
    it('should return all featured projects', async () => {
      const featuredProjects = [{ ...mockProject, featured: true }]
      mockDbQuery.findMany.mockResolvedValue(featuredProjects)

      const result = await projectService.getFeaturedProjects()

      expect(result).toEqual(featuredProjects)
    })

    it('should return featured projects for specific user', async () => {
      const featuredProjects = [{ ...mockProject, featured: true }]
      mockDbQuery.findMany.mockResolvedValue(featuredProjects)

      const result = await projectService.getFeaturedProjects('user-123')

      expect(result).toEqual(featuredProjects)
    })
  })

  describe('getPublicProjects', () => {
    it('should return public projects', async () => {
      const publicProjects = [{ ...mockProject, featured: true }]
      mockDbQuery.findMany.mockResolvedValue(publicProjects)

      const result = await projectService.getPublicProjects()

      expect(result).toEqual(publicProjects)
    })
  })

  describe('getAssignedProjects', () => {
    it('should return assigned projects for developer', async () => {
      const assignedProjects = [mockProject]
      mockDbQuery.findMany.mockResolvedValue(assignedProjects)

      const result = await projectService.getAssignedProjects('developer-123')

      expect(result).toEqual(assignedProjects)
    })
  })

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const createInput = {
        clientId: 'client-123',
        projectName: 'New Project',
        title: 'New Title',
        description: 'New Description',
        status: ProjectStatus.Approved,
      }

      mockDbQuery.findMany.mockResolvedValue([])
      mockHasSlugConflict.mockReturnValue(false)
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockProject]),
        }),
      } as any)

      const result = await projectService.createProject(createInput)

      expect(mockDbInsert).toHaveBeenCalled()
      expect(result).toEqual(mockProject)
    })

    it('should throw error for duplicate slug', async () => {
      const createInput = {
        clientId: 'client-123',
        projectName: 'Existing Project',
        title: 'Title',
        description: 'Description',
      }

      mockDbQuery.findMany.mockResolvedValue([
        { ...mockProject, id: 'existing', projectName: 'Existing Project' },
      ])
      mockHasSlugConflict.mockReturnValue(true)

      await expect(projectService.createProject(createInput)).rejects.toThrow(
        GraphQLError
      )
    })

    it('should throw error for invalid status', async () => {
      const createInput = {
        clientId: 'client-123',
        projectName: 'New Project',
        status: 'INVALID_STATUS',
      }

      mockDbQuery.findMany.mockResolvedValue([])
      mockHasSlugConflict.mockReturnValue(false)

      await expect(projectService.createProject(createInput)).rejects.toThrow(
        GraphQLError
      )
    })

    it('should throw error when creation fails', async () => {
      const createInput = {
        clientId: 'client-123',
        projectName: 'New Project',
      }

      mockDbQuery.findMany.mockResolvedValue([])
      mockHasSlugConflict.mockReturnValue(false)
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      } as any)

      await expect(projectService.createProject(createInput)).rejects.toThrow(
        GraphQLError
      )
    })
  })

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      const updateInput = { title: 'Updated Title' }
      const updatedProject = { ...mockProject, title: 'Updated Title' }

      mockDbQuery.findFirst.mockResolvedValue(mockProject)
      mockDbTransaction.mockImplementation(async (callback) => {
        return callback({
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([updatedProject]),
              }),
            }),
          }),
          insert: vi.fn(),
        } as any)
      })

      const result = await projectService.updateProject(
        'project-123',
        updateInput,
        'client-123',
        'client'
      )

      expect(result).toEqual(updatedProject)
    })

    it('should throw error when project not found', async () => {
      mockDbQuery.findFirst.mockResolvedValue(undefined)

      await expect(
        projectService.updateProject(
          'project-123',
          { title: 'Updated' },
          'client-123',
          'client'
        )
      ).rejects.toThrow(GraphQLError)
    })

    it('should throw access denied error for unauthorized user', async () => {
      const otherProject = { ...mockProject, clientId: 'other-client' }
      mockDbQuery.findFirst.mockResolvedValue(otherProject)

      await expect(
        projectService.updateProject(
          'project-123',
          { title: 'Updated' },
          'client-123',
          'client' // Use lowercase as expected by the service
        )
      ).rejects.toThrow(GraphQLError)
    })

    it('should create status update when status changes', async () => {
      const updateInput = { status: 'in_progress' }
      const updatedProject = { ...mockProject, status: 'in_progress' }

      mockDbQuery.findFirst.mockResolvedValue(mockProject)
      mockDbTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([updatedProject]),
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue(undefined),
          }),
        }
        return callback(mockTx as any)
      })

      await projectService.updateProject(
        'project-123',
        updateInput,
        'client-123',
        'client'
      )

      expect(mockDbTransaction).toHaveBeenCalled()
    })
  })

  describe('updateProjectLogo', () => {
    it('should update project logo successfully', async () => {
      const fileMetadata = {
        fileName: 'logo.jpg',
        originalFileName: 'original-logo.jpg',
        fileSize: 1024,
        contentType: 'image/jpeg',
      }

      mockFileService.getFileMetadata.mockResolvedValue(fileMetadata)
      mockFileService.createProjectFileRecord.mockResolvedValue({
        id: 'file-123',
      })

      await projectService.updateProjectLogo(
        'project-123',
        'new-logo-key',
        'user-123'
      )

      expect(mockFileService.createProjectFileRecord).toHaveBeenCalledWith({
        projectId: 'project-123',
        fileName: fileMetadata.fileName,
        originalFileName: fileMetadata.originalFileName,
        contentType: fileMetadata.contentType,
        fileSize: fileMetadata.fileSize,
        filePath: 'new-logo-key',
        uploadedBy: 'user-123',
        isClientVisible: true,
        description: 'Project logo',
      })
    })

    it('should delete old logo when updating', async () => {
      const fileMetadata = {
        fileName: 'logo.jpg',
        originalFileName: 'original-logo.jpg',
        fileSize: 1024,
        contentType: 'image/jpeg',
      }

      mockFileService.getFileMetadata.mockResolvedValue(fileMetadata)
      mockFileService.deleteFile.mockResolvedValue(undefined)
      mockFileService.createProjectFileRecord.mockResolvedValue({
        id: 'file-123',
      })

      await projectService.updateProjectLogo(
        'project-123',
        'new-logo-key',
        'user-123',
        'projects/old-logo-key' // Include 'projects/' to trigger deletion
      )

      expect(mockFileService.deleteFile).toHaveBeenCalledWith(
        'projects/old-logo-key'
      )
    })

    it('should handle missing file metadata gracefully', async () => {
      mockFileService.getFileMetadata.mockResolvedValue(null)

      await projectService.updateProjectLogo(
        'project-123',
        'new-logo-key',
        'user-123'
      )

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Could not retrieve file metadata')
      )
      expect(mockFileService.createProjectFileRecord).not.toHaveBeenCalled()
    })

    it('should continue when old logo deletion fails', async () => {
      const fileMetadata = {
        fileName: 'logo.jpg',
        originalFileName: 'original-logo.jpg',
        fileSize: 1024,
        contentType: 'image/jpeg',
      }

      mockFileService.getFileMetadata.mockResolvedValue(fileMetadata)
      mockFileService.deleteFile.mockRejectedValue(new Error('Delete failed'))
      mockFileService.createProjectFileRecord.mockResolvedValue({
        id: 'file-123',
      })

      await projectService.updateProjectLogo(
        'project-123',
        'new-logo-key',
        'user-123',
        'projects/old-logo-key' // Include 'projects/' to trigger deletion
      )

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete old logo'),
        { error: expect.any(Error) }
      )
      expect(mockFileService.createProjectFileRecord).toHaveBeenCalled()
    })
  })

  describe('updateProjectLogoWithMetadata', () => {
    it('should update project logo with provided metadata', async () => {
      const metadata = {
        fileName: 'logo.jpg',
        originalFileName: 'original-logo.jpg',
        fileSize: 1024,
        contentType: 'image/jpeg',
      }

      mockFileService.createProjectFileRecord.mockResolvedValue({
        id: 'file-123',
      })

      await projectService.updateProjectLogoWithMetadata(
        'project-123',
        'new-logo-key',
        metadata,
        'user-123'
      )

      expect(mockFileService.createProjectFileRecord).toHaveBeenCalledWith({
        projectId: 'project-123',
        fileName: metadata.fileName,
        originalFileName: metadata.originalFileName,
        contentType: metadata.contentType,
        fileSize: metadata.fileSize,
        filePath: 'new-logo-key',
        uploadedBy: 'user-123',
        isClientVisible: true,
        description: 'Project logo',
      })
    })
  })

  describe('assignProject', () => {
    it('should assign project to developer successfully', async () => {
      const availableProject = {
        ...mockProject,
        developerId: null,
        status: ProjectStatus.Approved,
      }
      const assignedProject = {
        ...mockProject,
        developerId: 'developer-123',
        status: 'in_progress',
      }

      mockIsDeveloperOrHigherRole.mockReturnValue(true)
      mockDbQuery.findFirst.mockResolvedValue(availableProject)
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([assignedProject]),
          }),
        }),
      } as any)
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any)

      const result = await projectService.assignProject(
        'project-123',
        'developer-123',
        'developer-123',
        'developer'
      )

      expect(result).toEqual(assignedProject)
      expect(mockDbInsert).toHaveBeenCalled() // For status update
    })

    it('should throw error for non-developer user', async () => {
      mockIsDeveloperOrHigherRole.mockReturnValue(false)

      await expect(
        projectService.assignProject(
          'project-123',
          'developer-123',
          'client-123',
          'client'
        )
      ).rejects.toThrow(GraphQLError)
    })

    it('should throw error when developer tries to assign to someone else', async () => {
      mockIsDeveloperOrHigherRole.mockReturnValue(true)

      await expect(
        projectService.assignProject(
          'project-123',
          'other-developer',
          'developer-123',
          'developer'
        )
      ).rejects.toThrow(GraphQLError)
    })

    it('should throw error when project not found', async () => {
      mockIsDeveloperOrHigherRole.mockReturnValue(true)
      mockDbQuery.findFirst.mockResolvedValue(undefined)

      await expect(
        projectService.assignProject(
          'project-123',
          'developer-123',
          'developer-123',
          'developer'
        )
      ).rejects.toThrow(GraphQLError)
    })

    it('should throw error when project already assigned', async () => {
      const assignedProject = { ...mockProject, developerId: 'other-developer' }

      mockIsDeveloperOrHigherRole.mockReturnValue(true)
      mockDbQuery.findFirst.mockResolvedValue(assignedProject)

      await expect(
        projectService.assignProject(
          'project-123',
          'developer-123',
          'developer-123',
          'developer'
        )
      ).rejects.toThrow(GraphQLError)
    })
  })

  describe('updateProjectStatus', () => {
    it('should update project status successfully', async () => {
      const statusInput = {
        newStatus: 'in_progress',
        progressPercentage: 25,
        updateMessage: 'Started development',
        isClientVisible: true,
      }

      mockDbQuery.findFirst.mockResolvedValue(mockProject)
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'status-123' }]),
        }),
      } as any)
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any)

      const result = await projectService.updateProjectStatus(
        'project-123',
        statusInput,
        'developer-123',
        'developer'
      )

      expect(mockDbInsert).toHaveBeenCalled()
      expect(mockDbUpdate).toHaveBeenCalled()
      expect(result).toEqual({ id: 'status-123' })
    })

    it('should throw error when user not authenticated', async () => {
      await expect(
        projectService.updateProjectStatus(
          'project-123',
          { newStatus: 'in_progress' },
          undefined,
          'developer'
        )
      ).rejects.toThrow(GraphQLError)
    })

    it('should throw error when project not found', async () => {
      mockDbQuery.findFirst.mockResolvedValue(undefined)

      await expect(
        projectService.updateProjectStatus(
          'project-123',
          { newStatus: 'in_progress' },
          'developer-123',
          'developer'
        )
      ).rejects.toThrow(GraphQLError)
    })

    it('should throw access denied error for unauthorized user', async () => {
      const otherProject = {
        ...mockProject,
        clientId: 'other-client',
        developerId: 'other-dev',
      }
      mockDbQuery.findFirst.mockResolvedValue(otherProject)

      await expect(
        projectService.updateProjectStatus(
          'project-123',
          { newStatus: 'in_progress' },
          'client-123',
          'client' // Use lowercase as expected by the service
        )
      ).rejects.toThrow(GraphQLError)
    })
  })

  describe('getProjectStatusUpdates', () => {
    it('should return all status updates for admin', async () => {
      const mockStatusUpdates = [
        {
          id: 'update-1',
          isClientVisible: true,
          createdAt: new Date(),
          progressPercentage: null,
          entityType: 'project',
          entityId: 'project-123',
          oldStatus: null,
          newStatus: ProjectStatus.Approved,
          updateMessage: 'Project approved',
          updatedBy: 'admin-123',
        },
        {
          id: 'update-2',
          isClientVisible: false,
          createdAt: new Date(),
          progressPercentage: null,
          entityType: 'project',
          entityId: 'project-123',
          oldStatus: ProjectStatus.Approved,
          newStatus: 'in_progress',
          updateMessage: 'Project started',
          updatedBy: 'developer-123',
        },
      ]

      mockIsAdminRole.mockReturnValue(true)
      mockDbQueryStatusUpdates.findMany.mockResolvedValue(mockStatusUpdates)

      const result = await projectService.getProjectStatusUpdates(
        'project-123',
        'admin'
      )

      expect(result).toEqual(mockStatusUpdates)
    })

    it('should return only client-visible status updates for non-admin', async () => {
      const mockStatusUpdates = [
        {
          id: 'update-1',
          createdAt: new Date(),
          progressPercentage: null,
          entityType: 'project',
          entityId: 'project-123',
          oldStatus: null,
          newStatus: 'in_progress',
          updateMessage: 'Project started',
          isClientVisible: true,
          updatedBy: 'developer-123',
        },
      ]

      mockIsAdminRole.mockReturnValue(false)
      mockDbQueryStatusUpdates.findMany.mockResolvedValue(mockStatusUpdates)

      const result = await projectService.getProjectStatusUpdates(
        'project-123',
        'client'
      )

      expect(result).toEqual(mockStatusUpdates)
    })
  })

  describe('getCompleteProjectStatusHistory', () => {
    it('should return complete status history including request history', async () => {
      const projectWithRequest = { ...mockProject, requestId: 'request-123' }
      const mockStatusUpdates = [
        {
          id: 'update-1',
          createdAt: new Date(),
          progressPercentage: null,
          entityType: 'project_request',
          entityId: 'request-123',
          oldStatus: null,
          newStatus: 'in_review',
          updateMessage: 'Request moved to review',
          isClientVisible: true,
          updatedBy: 'admin-123',
        },
        {
          id: 'update-2',
          createdAt: new Date(),
          progressPercentage: null,
          entityType: 'project',
          entityId: 'project-123',
          oldStatus: 'approved',
          newStatus: 'in_progress',
          updateMessage: 'Project started',
          isClientVisible: true,
          updatedBy: 'developer-123',
        },
      ]

      mockDbQuery.findFirst.mockResolvedValue(projectWithRequest)
      mockIsAdminRole.mockReturnValue(true)
      mockDbQueryStatusUpdates.findMany.mockResolvedValue(mockStatusUpdates)

      const result = await projectService.getCompleteProjectStatusHistory(
        'project-123',
        'admin-123',
        'admin'
      )

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Found status updates',
        expect.objectContaining({ count: 2 })
      )
      expect(result).toEqual(mockStatusUpdates)
    })

    it('should return only project status history when no request ID', async () => {
      const projectWithoutRequest = { ...mockProject, requestId: null }
      const mockStatusUpdates = [
        {
          id: 'update-1',
          createdAt: new Date(),
          progressPercentage: null,
          entityType: 'project',
          entityId: 'project-123',
          oldStatus: null,
          newStatus: 'in_progress',
          updateMessage: 'Project started',
          isClientVisible: true,
          updatedBy: 'developer-123',
        },
      ]

      mockDbQuery.findFirst.mockResolvedValue(projectWithoutRequest)
      mockIsAdminRole.mockReturnValue(false)
      mockDbQueryStatusUpdates.findMany.mockResolvedValue(mockStatusUpdates)

      const result = await projectService.getCompleteProjectStatusHistory(
        'project-123',
        'client-123',
        'client'
      )

      expect(result).toEqual(mockStatusUpdates)
    })
  })

  describe('getProjectCollaborators', () => {
    it('should return project collaborators', async () => {
      const mockCollaborators = [
        {
          id: 'collab-1',
          userId: 'user-1',
          projectId: 'project-123',
          role: 'viewer',
          createdAt: new Date(),
          canViewFiles: true,
          canUploadFiles: false,
          canManageDomains: false,
          addedBy: 'admin-123',
        },
      ]

      mockDbQueryProjectCollaborators.findMany.mockResolvedValue(
        mockCollaborators
      )

      const result = await projectService.getProjectCollaborators('project-123')

      expect(result).toEqual(mockCollaborators)
    })
  })

  describe('getProjectRequestById', () => {
    it('should return project request by ID', async () => {
      const mockRequest = {
        id: 'request-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-123',
        projectName: 'Test Project',
        title: 'Test Title',
        description: 'Test Description',
        projectType: 'web_app',
        budget: 5000,
        timeline: '3 months',
        requirements: ['Feature 1'],
        contactPreference: 'EMAIL',
        additionalInfo: 'Additional info',
        status: 'requested',
        reviewedAt: null,
        reviewedBy: null,
      }

      mockDbQueryProjectRequests.findFirst.mockResolvedValue(mockRequest)

      const result = await projectService.getProjectRequestById('request-123')

      expect(result).toEqual(mockRequest)
    })
  })
})
