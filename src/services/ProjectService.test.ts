import { GraphQLError } from 'graphql'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectFeature, ProjectPriority, ProjectStatus, ProjectType } from '@/graphql/schema'
import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import {
  findProjectBySlug,
  hasSlugConflict,
  isAdminRole,
  isDeveloperOrHigherRole,
} from '@/utils'

import {
  createRepoFromTemplate,
  deleteRepo,
} from './GitHubService'
import {
  createNeonProject,
  deleteNeonProject,
} from './NeonService'
import { ProjectService } from './ProjectService'
import {
  addVercelEnvVar,
  createVercelProject,
  triggerVercelDeployment,
} from './VercelService'

const mockEnv = vi.hoisted(() => ({
  R2_ACCOUNT_ID: 'test-r2-account-id' as string | undefined,
  R2_ACCESS_KEY_ID: 'test-r2-access-key' as string | undefined,
  R2_SECRET_ACCESS_KEY: 'test-r2-secret' as string | undefined,
  R2_BUCKET_NAME: 'test-bucket' as string | undefined,
  RESEND_API_KEY: 'test-resend-key' as string | undefined,
}))

vi.mock('@/libs/Env', () => ({ Env: mockEnv }))

// Mock GitHub, Vercel, and Neon provisioning services
vi.mock('./GitHubService', () => ({
  createRepoFromTemplate: vi.fn(),
  deleteRepo: vi.fn(),
}))

vi.mock('./VercelService', () => ({
  createVercelProject: vi.fn(),
  deleteVercelProject: vi.fn(),
  addVercelEnvVar: vi.fn(),
  triggerVercelDeployment: vi.fn(),
}))

vi.mock('./NeonService', () => ({
  createNeonProject: vi.fn(),
  deleteNeonProject: vi.fn(),
}))

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
  generateSlug: vi.fn().mockReturnValue('test-project'),
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
  const mockCreateRepoFromTemplate = vi.mocked(createRepoFromTemplate)
  const mockDeleteRepo = vi.mocked(deleteRepo)
  const mockCreateVercelProject = vi.mocked(createVercelProject)
  const mockAddVercelEnvVar = vi.mocked(addVercelEnvVar)
  const mockTriggerVercelDeployment = vi.mocked(triggerVercelDeployment)
  const mockCreateNeonProject = vi.mocked(createNeonProject)
  const mockDeleteNeonProject = vi.mocked(deleteNeonProject)

  const mockProject = {
    id: 'project-123',
    clientId: 'client-123',
    developerId: 'developer-123',
    requestId: 'request-123',
    projectName: 'Test Project',
    title: 'Test Title',
    description: 'Test Description',
    projectType: ProjectType.WebApp,
    budget: 5000,
    requirements: null,
    features: [ProjectFeature.Database, ProjectFeature.Auth, ProjectFeature.Email],
    techStack: ['React', 'Node.js'],
    status: ProjectStatus.Approved,
    progressPercentage: 50,
    featured: false,
    logo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Add missing required properties
    overview: null,
    priority: ProjectPriority.Medium,
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
    neonProjectId: null,
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

    it('should seed features from projectType defaults', async () => {
      const createInput = {
        clientId: 'client-123',
        projectName: 'New Website',
        description: 'A simple website',
        projectType: ProjectType.Website,
        status: ProjectStatus.Approved,
      }

      mockDbQuery.findMany.mockResolvedValue([])
      mockHasSlugConflict.mockReturnValue(false)

      let capturedValues: any
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockImplementation((v) => {
          capturedValues = v
          return { returning: vi.fn().mockResolvedValue([mockProject]) }
        }),
      } as any)

      await projectService.createProject(createInput)

      expect(capturedValues.features).toEqual([ProjectFeature.Email])
    })

    it('should preserve explicit features over type defaults', async () => {
      const createInput = {
        clientId: 'client-123',
        projectName: 'Custom Project',
        description: 'A project with custom features',
        projectType: ProjectType.Website,
        status: ProjectStatus.Approved,
        features: [ProjectFeature.Database, ProjectFeature.Email],
      }

      mockDbQuery.findMany.mockResolvedValue([])
      mockHasSlugConflict.mockReturnValue(false)

      let capturedValues: any
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockImplementation((v) => {
          capturedValues = v
          return { returning: vi.fn().mockResolvedValue([mockProject]) }
        }),
      } as any)

      await projectService.createProject(createInput)

      expect(capturedValues.features).toEqual([
        ProjectFeature.Database,
        ProjectFeature.Email,
      ])
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
        newStatus: ProjectStatus.InProgress,
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
        'developer-123'
      )

      expect(mockDbInsert).toHaveBeenCalled()
      expect(mockDbUpdate).toHaveBeenCalled()
      expect(result).toEqual({ id: 'status-123' })
    })

    it('should throw error when user not authenticated', async () => {
      await expect(
        projectService.updateProjectStatus(
          'project-123',
          { newStatus: ProjectStatus.InProgress },
          undefined
        )
      ).rejects.toThrow(GraphQLError)
    })

    it('should throw error when project not found', async () => {
      mockDbQuery.findFirst.mockResolvedValue(undefined)

      await expect(
        projectService.updateProjectStatus(
          'project-123',
          { newStatus: ProjectStatus.InProgress },
          'developer-123'
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
          { newStatus: ProjectStatus.InProgress },
          'client-123'
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
          newStatus: ProjectStatus.InProgress,
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
          newStatus: ProjectStatus.InProgress,
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
          newStatus: ProjectStatus.InReview,
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
          oldStatus: ProjectStatus.Approved,
          newStatus: ProjectStatus.InProgress,
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
          newStatus: ProjectStatus.InProgress,
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
        projectType: ProjectType.WebApp,
        budget: 5000,
        timeline: '3 months',
        requirements: null,
        contactPreference: 'EMAIL',
        additionalInfo: 'Additional info',
        status: ProjectStatus.Requested,
        reviewedAt: null,
        reviewedBy: null,
      }

      mockDbQueryProjectRequests.findFirst.mockResolvedValue(mockRequest)

      const result = await projectService.getProjectRequestById('request-123')

      expect(result).toEqual(mockRequest)
    })
  })

  describe('provisionProjectRepo', () => {
    const mockRepo = {
      html_url: 'https://github.com/c0d3ster/test-project',
      name: 'test-project',
      ssh_url: 'git@github.com:c0d3ster/test-project.git',
      clone_url: 'https://github.com/c0d3ster/test-project.git',
    }
    const mockStagingUrl = 'https://test-project.vercel.app'
    const mockNeonProjectId = 'neon-project-123'
    const mockDatabaseUrl = 'postgresql://user:pass@host/db'
    const mockClientEmail = 'client@example.com'
    const mockProvisionedProject = {
      ...mockProject,
      repositoryUrl: mockRepo.html_url,
      stagingUrl: mockStagingUrl,
      neonProjectId: mockNeonProjectId,
    }

    const createMockSelectFn = (projectOverride?: any) =>
      vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              for: vi.fn().mockResolvedValue([projectOverride ?? mockProject]),
            }),
          }),
        })
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ email: mockClientEmail }]),
          }),
        })

    const setupHappyPathTransaction = () => {
      mockDbTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          select: createMockSelectFn(),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockProvisionedProject]),
              }),
            }),
          }),
        }
        return callback(mockTx as any)
      })
    }

    beforeEach(() => {
      mockCreateRepoFromTemplate.mockResolvedValue(mockRepo)
      mockCreateVercelProject.mockResolvedValue(mockStagingUrl)
      mockCreateNeonProject.mockResolvedValue({
        neonProjectId: mockNeonProjectId,
        databaseUrl: mockDatabaseUrl,
      })
      mockAddVercelEnvVar.mockResolvedValue(undefined)
      mockTriggerVercelDeployment.mockResolvedValue(undefined)
      mockIsAdminRole.mockReturnValue(false)
      mockEnv.R2_ACCOUNT_ID = 'test-r2-account-id'
      mockEnv.R2_ACCESS_KEY_ID = 'test-r2-access-key'
      mockEnv.R2_SECRET_ACCESS_KEY = 'test-r2-secret'
      mockEnv.R2_BUCKET_NAME = 'test-bucket'
      mockEnv.RESEND_API_KEY = 'test-resend-key'
    })

    it('should provision repo and Vercel project for admin', async () => {
      mockIsAdminRole.mockReturnValue(true)
      setupHappyPathTransaction()

      const result = await projectService.provisionProjectRepo(
        'project-123',
        'admin-user',
        'admin'
      )

      expect(mockCreateRepoFromTemplate).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      )
      expect(mockCreateVercelProject).toHaveBeenCalledWith(expect.any(String))
      expect(result).toEqual(mockProvisionedProject)
    })

    it('should provision repo for assigned developer', async () => {
      setupHappyPathTransaction()

      const result = await projectService.provisionProjectRepo(
        'project-123',
        'developer-123',
        'developer'
      )

      expect(mockCreateRepoFromTemplate).toHaveBeenCalled()
      expect(mockCreateVercelProject).toHaveBeenCalled()
      expect(result).toEqual(mockProvisionedProject)
    })

    it('should set NEXT_PUBLIC_BRAND_NAME and SUPPORT_EMAIL env vars', async () => {
      mockIsAdminRole.mockReturnValue(true)
      setupHappyPathTransaction()

      await projectService.provisionProjectRepo(
        'project-123',
        'admin-user',
        'admin'
      )

      expect(mockAddVercelEnvVar).toHaveBeenCalledWith(
        mockRepo.name,
        'NEXT_PUBLIC_BRAND_NAME',
        mockProject.projectName
      )
      expect(mockAddVercelEnvVar).toHaveBeenCalledWith(
        mockRepo.name,
        'SUPPORT_EMAIL',
        mockClientEmail
      )
    })

    it('should throw CLIENT_NOT_FOUND when client user does not exist', async () => {
      mockIsAdminRole.mockReturnValue(true)
      mockDbTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          select: vi.fn()
            .mockReturnValueOnce({
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  for: vi.fn().mockResolvedValue([mockProject]),
                }),
              }),
            })
            .mockReturnValue({
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([]),
              }),
            }),
        }
        return callback(mockTx as any)
      })

      await expect(
        projectService.provisionProjectRepo(
          'project-123',
          'admin-user',
          'admin'
        )
      ).rejects.toMatchObject({
        extensions: { code: 'CLIENT_NOT_FOUND' },
      })

      expect(mockCreateRepoFromTemplate).not.toHaveBeenCalled()
    })

    it('should provision a Neon project and add DATABASE_URL when project has database feature', async () => {
      mockIsAdminRole.mockReturnValue(true)
      setupHappyPathTransaction()

      await projectService.provisionProjectRepo(
        'project-123',
        'admin-user',
        'admin'
      )

      expect(mockCreateNeonProject).toHaveBeenCalledWith('test-project')
      expect(mockAddVercelEnvVar).toHaveBeenCalledWith(
        mockRepo.name,
        'DATABASE_URL',
        mockDatabaseUrl
      )
    })

    it('should not provision Neon when project has no database feature', async () => {
      mockIsAdminRole.mockReturnValue(true)
      const projectWithoutDb = {
        ...mockProject,
        features: [ProjectFeature.Email],
      }
      mockDbTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          select: createMockSelectFn(projectWithoutDb),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockProvisionedProject]),
              }),
            }),
          }),
        }
        return callback(mockTx as any)
      })

      await projectService.provisionProjectRepo(
        'project-123',
        'admin-user',
        'admin'
      )

      expect(mockCreateNeonProject).not.toHaveBeenCalled()
      expect(mockAddVercelEnvVar).not.toHaveBeenCalledWith(
        mockRepo.name,
        'DATABASE_URL',
        expect.anything()
      )
    })

    it('should add RESEND_API_KEY env var when project has email feature', async () => {
      mockIsAdminRole.mockReturnValue(true)
      setupHappyPathTransaction()

      await projectService.provisionProjectRepo(
        'project-123',
        'admin-user',
        'admin'
      )

      expect(mockAddVercelEnvVar).toHaveBeenCalledWith(
        mockRepo.name,
        'RESEND_API_KEY',
        'test-resend-key'
      )
    })

    it('should not add RESEND_API_KEY when project has no email feature', async () => {
      mockIsAdminRole.mockReturnValue(true)
      const projectWithoutEmail = {
        ...mockProject,
        features: [ProjectFeature.Database],
      }
      mockDbTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          select: createMockSelectFn(projectWithoutEmail),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockProvisionedProject]),
              }),
            }),
          }),
        }
        return callback(mockTx as any)
      })

      await projectService.provisionProjectRepo(
        'project-123',
        'admin-user',
        'admin'
      )

      expect(mockAddVercelEnvVar).not.toHaveBeenCalledWith(
        mockRepo.name,
        'RESEND_API_KEY',
        expect.anything()
      )
    })

    it('should add R2 env vars to the provisioned Vercel project', async () => {
      mockIsAdminRole.mockReturnValue(true)
      setupHappyPathTransaction()

      await projectService.provisionProjectRepo(
        'project-123',
        'admin-user',
        'admin'
      )

      expect(mockAddVercelEnvVar).toHaveBeenCalledWith(
        mockRepo.name,
        'R2_ACCOUNT_ID',
        'test-r2-account-id'
      )
      expect(mockAddVercelEnvVar).toHaveBeenCalledWith(
        mockRepo.name,
        'R2_ACCESS_KEY_ID',
        'test-r2-access-key'
      )
      expect(mockAddVercelEnvVar).toHaveBeenCalledWith(
        mockRepo.name,
        'R2_SECRET_ACCESS_KEY',
        'test-r2-secret'
      )
      expect(mockAddVercelEnvVar).toHaveBeenCalledWith(
        mockRepo.name,
        'R2_BUCKET_NAME',
        'test-bucket'
      )
    })

    it('should not add R2 env vars when they are not configured', async () => {
      mockIsAdminRole.mockReturnValue(true)
      mockEnv.R2_ACCOUNT_ID = undefined
      mockEnv.R2_ACCESS_KEY_ID = undefined
      mockEnv.R2_SECRET_ACCESS_KEY = undefined
      mockEnv.R2_BUCKET_NAME = undefined
      setupHappyPathTransaction()

      await projectService.provisionProjectRepo(
        'project-123',
        'admin-user',
        'admin'
      )

      expect(mockAddVercelEnvVar).not.toHaveBeenCalledWith(
        mockRepo.name,
        'R2_ACCOUNT_ID',
        expect.anything()
      )
    })

    it('should add PROJECT_LOGO_KEY env var when project has an R2 logo', async () => {
      mockIsAdminRole.mockReturnValue(true)
      const projectWithLogo = {
        ...mockProject,
        logo: 'projects/project-123/logo.png',
      }
      mockDbTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          select: createMockSelectFn(projectWithLogo),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockProvisionedProject]),
              }),
            }),
          }),
        }
        return callback(mockTx as any)
      })

      await projectService.provisionProjectRepo(
        'project-123',
        'admin-user',
        'admin'
      )

      expect(mockAddVercelEnvVar).toHaveBeenCalledWith(
        mockRepo.name,
        'PROJECT_LOGO_KEY',
        'projects/project-123/logo.png'
      )
    })

    it('should not add PROJECT_LOGO_KEY when project has no logo', async () => {
      mockIsAdminRole.mockReturnValue(true)
      setupHappyPathTransaction()

      await projectService.provisionProjectRepo(
        'project-123',
        'admin-user',
        'admin'
      )

      expect(mockAddVercelEnvVar).not.toHaveBeenCalledWith(
        mockRepo.name,
        'PROJECT_LOGO_KEY',
        expect.anything()
      )
    })

    it('should save neonProjectId to the project record', async () => {
      mockIsAdminRole.mockReturnValue(true)
      let capturedSet: any
      mockDbTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          select: createMockSelectFn(),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockImplementation((data) => {
              capturedSet = data
              return {
                where: vi.fn().mockReturnValue({
                  returning: vi
                    .fn()
                    .mockResolvedValue([mockProvisionedProject]),
                }),
              }
            }),
          }),
        }
        return callback(mockTx as any)
      })

      await projectService.provisionProjectRepo(
        'project-123',
        'admin-user',
        'admin'
      )

      expect(capturedSet).toMatchObject({ neonProjectId: mockNeonProjectId })
    })

    it('should throw FORBIDDEN for a non-admin non-assigned user', async () => {
      mockDbTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                for: vi.fn().mockResolvedValue([mockProject]),
              }),
            }),
          }),
        }
        return callback(mockTx as any)
      })

      await expect(
        projectService.provisionProjectRepo(
          'project-123',
          'client-123',
          'client'
        )
      ).rejects.toMatchObject({
        extensions: { code: 'FORBIDDEN' },
      })

      expect(mockCreateRepoFromTemplate).not.toHaveBeenCalled()
    })

    it('should throw REPO_ALREADY_PROVISIONED when repositoryUrl is set', async () => {
      const alreadyProvisioned = {
        ...mockProject,
        repositoryUrl: 'https://github.com/c0d3ster/existing',
      }
      mockIsAdminRole.mockReturnValue(true)
      mockDbTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                for: vi.fn().mockResolvedValue([alreadyProvisioned]),
              }),
            }),
          }),
        }
        return callback(mockTx as any)
      })

      await expect(
        projectService.provisionProjectRepo(
          'project-123',
          'admin-user',
          'admin'
        )
      ).rejects.toMatchObject({
        extensions: { code: 'REPO_ALREADY_PROVISIONED' },
      })
    })

    it('should throw PROJECT_NOT_FOUND when project does not exist', async () => {
      mockIsAdminRole.mockReturnValue(true)
      mockDbTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                for: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }
        return callback(mockTx as any)
      })

      await expect(
        projectService.provisionProjectRepo(
          'project-123',
          'admin-user',
          'admin'
        )
      ).rejects.toMatchObject({
        extensions: { code: 'PROJECT_NOT_FOUND' },
      })
    })

    it('should propagate Vercel failure, rollback repo, and not save to DB', async () => {
      mockIsAdminRole.mockReturnValue(true)
      mockCreateVercelProject.mockRejectedValue(
        new GraphQLError('Vercel project creation failed', {
          extensions: { code: 'VERCEL_PROJECT_CREATION_FAILED' },
        })
      )
      const mockTxUpdate = vi.fn()
      mockDbTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          select: createMockSelectFn(),
          update: mockTxUpdate,
        }
        return callback(mockTx as any)
      })

      await expect(
        projectService.provisionProjectRepo(
          'project-123',
          'admin-user',
          'admin'
        )
      ).rejects.toMatchObject({
        extensions: { code: 'VERCEL_PROJECT_CREATION_FAILED' },
      })

      expect(mockTxUpdate).not.toHaveBeenCalled()
      expect(mockDeleteRepo).toHaveBeenCalledWith('test-project')
    })

    it('should rollback repo, Vercel, and Neon on Neon failure', async () => {
      mockIsAdminRole.mockReturnValue(true)
      mockCreateNeonProject.mockRejectedValue(
        new GraphQLError('Neon project creation failed', {
          extensions: { code: 'NEON_PROJECT_CREATION_FAILED' },
        })
      )
      const mockTxUpdate = vi.fn()
      mockDbTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          select: createMockSelectFn(),
          update: mockTxUpdate,
        }
        return callback(mockTx as any)
      })

      await expect(
        projectService.provisionProjectRepo(
          'project-123',
          'admin-user',
          'admin'
        )
      ).rejects.toMatchObject({
        extensions: { code: 'NEON_PROJECT_CREATION_FAILED' },
      })

      expect(mockTxUpdate).not.toHaveBeenCalled()
      expect(mockDeleteRepo).toHaveBeenCalledWith('test-project')
      expect(mockDeleteNeonProject).not.toHaveBeenCalled()
    })
  })
})
