import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SUPPORT_EMAIL } from '@/constants'
import { ProjectResolver } from '@/graphql/resolvers/ProjectResolver'
import { UserRole } from '@/graphql/schema'
import { createMockUser } from '@/tests/mocks/auth'
import { createMockProject } from '@/tests/mocks/projects'
import {
  createMockFileService,
  createMockProjectService,
  createMockUserService,
} from '@/tests/mocks/services'

// Mock utils
vi.mock('@/utils', () => ({
  isAdminRole: vi.fn(),
  isDeveloperOrHigherRole: vi.fn(),
  findProjectBySlug: vi.fn(),
  hasSlugConflict: vi.fn(),
  formatProfileDate: (date: string) => new Date(date).toLocaleDateString(),
}))

describe('ProjectResolver', () => {
  let projectResolver: ProjectResolver
  let mockProjectService: ReturnType<typeof createMockProjectService>
  let mockUserService: ReturnType<typeof createMockUserService>
  let mockFileService: ReturnType<typeof createMockFileService>

  beforeEach(() => {
    mockProjectService = createMockProjectService()
    mockUserService = createMockUserService()
    mockFileService = createMockFileService()
    projectResolver = new ProjectResolver(
      mockProjectService as any,
      mockUserService as any,
      mockFileService as any
    )
  })

  describe('projects', () => {
    it('should return projects for authenticated user', async () => {
      const mockProjects = [createMockProject()]
      const currentUser = createMockUser()

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjects.mockResolvedValue(mockProjects)

      const result = await projectResolver.projects()

      expect(result).toEqual(mockProjects)
      expect(mockProjectService.getProjects).toHaveBeenCalledWith(
        undefined,
        currentUser.id,
        currentUser.role
      )
    })

    it('should return projects for support email without auth', async () => {
      const mockProjects = [createMockProject()]

      mockProjectService.getProjects.mockResolvedValue(mockProjects)

      const result = await projectResolver.projects(undefined, SUPPORT_EMAIL)

      expect(result).toEqual(mockProjects)
      expect(mockProjectService.getProjects).toHaveBeenCalledWith(undefined)
    })

    it('should return projects for specific user email', async () => {
      const mockProjects = [createMockProject()]
      const currentUser = createMockUser()
      const targetUser = createMockUser({
        id: 'user-2',
        email: 'target@example.com',
      })

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.getUserByEmail.mockResolvedValue(targetUser)
      mockProjectService.getProjects.mockResolvedValue(mockProjects)

      const result = await projectResolver.projects(
        undefined,
        'target@example.com'
      )

      expect(result).toEqual(mockProjects)
      expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(
        'target@example.com'
      )
      expect(mockProjectService.getProjects).toHaveBeenCalledWith(
        undefined,
        targetUser.id,
        targetUser.role
      )
    })
  })

  describe('project', () => {
    it('should return project by id', async () => {
      const mockProject = createMockProject()
      const currentUser = createMockUser()

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(mockProject)

      const result = await projectResolver.project('project-1')

      expect(result).toEqual(mockProject)
      expect(mockProjectService.getProjectById).toHaveBeenCalledWith(
        'project-1',
        currentUser.id,
        currentUser.role
      )
    })
  })

  describe('projectBySlug', () => {
    it('should return project by slug for authenticated user', async () => {
      const mockProject = createMockProject()
      const currentUser = createMockUser()

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectBySlug.mockResolvedValue(mockProject)

      const result = await projectResolver.projectBySlug('test-project')

      expect(result).toEqual(mockProject)
      expect(mockProjectService.getProjectBySlug).toHaveBeenCalledWith(
        'test-project',
        currentUser.id,
        currentUser.role
      )
    })

    it('should return project by slug for public access', async () => {
      const mockProject = createMockProject()

      mockUserService.getCurrentUserWithAuth.mockRejectedValue(
        new Error('Not authenticated')
      )
      mockProjectService.getProjectBySlug.mockResolvedValue(mockProject)

      const result = await projectResolver.projectBySlug('test-project')

      expect(result).toEqual(mockProject)
      expect(mockProjectService.getProjectBySlug).toHaveBeenCalledWith(
        'test-project',
        undefined,
        undefined
      )
    })
  })

  describe('featuredProjects', () => {
    it('should return featured projects for authenticated user', async () => {
      const mockProjects = [createMockProject()]
      const currentUser = createMockUser()

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getFeaturedProjects.mockResolvedValue(mockProjects)

      const result = await projectResolver.featuredProjects()

      expect(result).toEqual(mockProjects)
      expect(mockProjectService.getFeaturedProjects).toHaveBeenCalledWith()
    })

    it('should return featured projects for support email without auth', async () => {
      const mockProjects = [createMockProject()]

      mockProjectService.getFeaturedProjects.mockResolvedValue(mockProjects)

      const result = await projectResolver.featuredProjects(SUPPORT_EMAIL)

      expect(result).toEqual(mockProjects)
      expect(mockProjectService.getFeaturedProjects).toHaveBeenCalledWith()
    })
  })

  describe('createProject', () => {
    it('should create project when admin', async () => {
      const mockProject = createMockProject()
      const currentUser = createMockUser({ role: UserRole.Admin })
      const input = {
        projectName: 'New Project',
        description: 'A new project',
        projectType: 'WEB_APP' as any,
        status: 'DRAFT' as any,
      }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {})
      mockProjectService.createProject.mockResolvedValue(mockProject)

      const result = await projectResolver.createProject(input)

      expect(result).toEqual(mockProject)
      expect(mockUserService.checkPermission).toHaveBeenCalledWith(
        currentUser,
        UserRole.Admin
      )
      expect(mockProjectService.createProject).toHaveBeenCalledWith(input)
    })

    it('should throw error when not admin', async () => {
      const currentUser = createMockUser({ role: UserRole.Client })
      const input = {
        projectName: 'New Project',
        description: 'A new project',
        projectType: 'WebApp' as any,
        status: 'Requested' as any,
      }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {
        throw new Error('Access denied')
      })

      await expect(projectResolver.createProject(input)).rejects.toThrow(
        'Access denied'
      )
    })
  })

  describe('updateProject', () => {
    it('should update project', async () => {
      const mockProject = createMockProject()
      const currentUser = createMockUser()
      const input = { title: 'Updated Project' }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.updateProject.mockResolvedValue(mockProject)

      const result = await projectResolver.updateProject('project-1', input)

      expect(result).toEqual(mockProject)
      expect(mockProjectService.updateProject).toHaveBeenCalledWith(
        'project-1',
        input,
        currentUser.id,
        currentUser.role
      )
    })
  })

  describe('assignProject', () => {
    it('should assign project to developer', async () => {
      const mockProject = createMockProject()
      const currentUser = createMockUser()

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.assignProject.mockResolvedValue(mockProject)

      const result = await projectResolver.assignProject(
        'project-1',
        'developer-1'
      )

      expect(result).toEqual(mockProject)
      expect(mockProjectService.assignProject).toHaveBeenCalledWith(
        'project-1',
        'developer-1',
        currentUser.id,
        currentUser.role
      )
    })
  })

  describe('updateProjectStatus', () => {
    it('should update project status', async () => {
      const mockProject = createMockProject()
      const currentUser = createMockUser()

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.updateProjectStatus.mockResolvedValue(mockProject)

      const result = await projectResolver.updateProjectStatus(
        'project-1',
        'in_progress',
        50
      )

      expect(result).toEqual(mockProject)
      expect(mockProjectService.updateProjectStatus).toHaveBeenCalledWith(
        'project-1',
        {
          newStatus: 'in_progress',
          progressPercentage: 50,
          updateMessage: 'Status updated to in_progress',
          isClientVisible: true,
        },
        currentUser.id,
        currentUser.role
      )
    })
  })

  describe('Field Resolvers', () => {
    describe('client', () => {
      it('should return client user when clientId is present', async () => {
        const project = { ...createMockProject(), clientId: 'client-1' }
        const clientUser = createMockUser({ id: 'client-1' })

        mockUserService.getUserById.mockResolvedValue(clientUser)

        const result = await projectResolver.client(project as any)

        expect(result).toEqual(clientUser)
        expect(mockUserService.getUserById).toHaveBeenCalledWith('client-1')
      })

      it('should return null when clientId is not present', async () => {
        const project = { ...createMockProject(), clientId: null }

        const result = await projectResolver.client(project as any)

        expect(result).toBeNull()
        expect(mockUserService.getUserById).not.toHaveBeenCalled()
      })
    })

    describe('developer', () => {
      it('should return developer user when developerId is present', async () => {
        const project = { ...createMockProject(), developerId: 'developer-1' }
        const developerUser = createMockUser({ id: 'developer-1' })

        mockUserService.getUserById.mockResolvedValue(developerUser)

        const result = await projectResolver.developer(project as any)

        expect(result).toEqual(developerUser)
        expect(mockUserService.getUserById).toHaveBeenCalledWith('developer-1')
      })

      it('should return null when developerId is not present', async () => {
        const project = { ...createMockProject(), developerId: null }

        const result = await projectResolver.developer(project as any)

        expect(result).toBeNull()
        expect(mockUserService.getUserById).not.toHaveBeenCalled()
      })
    })

    describe('createdAt', () => {
      it('should return ISO string for valid date', () => {
        const project = {
          ...createMockProject(),
          createdAt: new Date('2024-01-01T00:00:00Z'),
        }

        const result = projectResolver.createdAt(project as any)

        expect(result).toBe('2024-01-01T00:00:00.000Z')
      })

      it('should return null for invalid date', () => {
        const project = {
          ...createMockProject(),
          createdAt: 'invalid-date' as any,
        }

        const result = projectResolver.createdAt(project as any)

        expect(result).toBeNull()
      })
    })

    describe('techStack', () => {
      it('should return array for valid JSON string', () => {
        const project = {
          ...createMockProject(),
          techStack: '["React", "TypeScript"]',
        }

        const result = projectResolver.techStack(project as any)

        expect(result).toEqual(['React', 'TypeScript'])
      })

      it('should return array for already parsed array', () => {
        const project = {
          ...createMockProject(),
          techStack: ['React', 'TypeScript'],
        }

        const result = projectResolver.techStack(project as any)

        expect(result).toEqual(['React', 'TypeScript'])
      })

      it('should return null for invalid JSON', () => {
        const project = { ...createMockProject(), techStack: 'invalid-json' }

        const result = projectResolver.techStack(project as any)

        expect(result).toBeNull()
      })
    })
  })
})
