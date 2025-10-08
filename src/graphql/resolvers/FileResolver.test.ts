import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FileResolver } from '@/graphql/resolvers/FileResolver'
import { Environment, UserRole } from '@/graphql/schema'
import { createMockUser } from '@/tests/mocks/auth'
import { createMockProject } from '@/tests/mocks/projects'
import {
  createMockFileService,
  createMockProjectService,
  createMockUserService,
} from '@/tests/mocks/services'

// Mock file-type
vi.mock('file-type', () => ({
  fileTypeFromBuffer: vi.fn(),
}))

// Mock data factory for files
const createMockFile = (overrides = {}) => ({
  key: 'test-file.jpg',
  fileName: 'test-file.jpg',
  contentType: 'image/jpeg',
  fileSize: 1024,
  uploadedBy: 'user-1',
  projectId: 'project-1',
  uploadedAt: new Date('2024-01-01'),
  ...overrides,
})

describe('FileResolver', () => {
  let fileResolver: FileResolver
  let mockFileService: ReturnType<typeof createMockFileService>
  let mockProjectService: ReturnType<typeof createMockProjectService>
  let mockUserService: ReturnType<typeof createMockUserService>

  beforeEach(() => {
    mockFileService = createMockFileService()
    mockProjectService = createMockProjectService()
    mockUserService = createMockUserService()
    fileResolver = new FileResolver(
      mockFileService as any,
      mockProjectService as any,
      mockUserService as any
    )
  })

  describe('files', () => {
    it('should return files for project filter', async () => {
      const mockFiles = [createMockFile()]
      const currentUser = createMockUser()
      const filter = { projectId: 'project-1', environment: Environment.DEV }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockFileService.listFiles.mockResolvedValue(['test-file.jpg'])
      mockFileService.getFileMetadata.mockResolvedValue(createMockFile())

      const result = await fileResolver.files(filter)

      expect(result).toEqual(mockFiles)
      expect(mockFileService.listFiles).toHaveBeenCalledWith(
        'dev/projects/project-1/'
      )
    })

    it('should return files for user filter when admin', async () => {
      const mockFiles = [createMockFile()]
      const currentUser = createMockUser({ role: UserRole.Admin })
      const filter = { userId: 'user-2', environment: Environment.DEV }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {})
      mockFileService.listFiles.mockResolvedValue(['test-file.jpg'])
      mockFileService.getFileMetadata.mockResolvedValue(createMockFile())

      const result = await fileResolver.files(filter)

      expect(result).toEqual(mockFiles)
      expect(mockUserService.checkPermission).toHaveBeenCalledWith(
        currentUser,
        UserRole.Admin
      )
      expect(mockFileService.listFiles).toHaveBeenCalledWith(
        'dev/users/user-2/'
      )
    })

    it('should return files for own user without admin check', async () => {
      const mockFiles = [createMockFile()]
      const currentUser = createMockUser({ id: 'user-1' })
      const filter = { userId: 'user-1', environment: Environment.DEV }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockFileService.listFiles.mockResolvedValue(['test-file.jpg'])
      mockFileService.getFileMetadata.mockResolvedValue(createMockFile())

      const result = await fileResolver.files(filter)

      expect(result).toEqual(mockFiles)
      expect(mockUserService.checkPermission).not.toHaveBeenCalled()
      expect(mockFileService.listFiles).toHaveBeenCalledWith(
        'dev/users/user-1/'
      )
    })

    it('should throw error when non-admin tries to access other user files', async () => {
      const currentUser = createMockUser({ role: UserRole.Client })
      const filter = { userId: 'user-2', environment: Environment.DEV }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {
        throw new Error('Access denied')
      })

      await expect(fileResolver.files(filter)).rejects.toThrow('Access denied')
    })
  })

  describe('file', () => {
    it('should return file metadata when user has access', async () => {
      const mockFile = createMockFile()
      const currentUser = createMockUser()

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockFileService.getFileMetadata.mockResolvedValue(mockFile)
      mockProjectService.getProjectById.mockResolvedValue(createMockProject())

      const result = await fileResolver.file('test-file.jpg')

      expect(result).toEqual(mockFile)
      expect(mockFileService.getFileMetadata).toHaveBeenCalledWith(
        'test-file.jpg'
      )
    })

    it('should return null when file not found', async () => {
      const currentUser = createMockUser()

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockFileService.getFileMetadata.mockResolvedValue(null)

      const result = await fileResolver.file('nonexistent-file.jpg')

      expect(result).toBeNull()
    })

    it('should throw error when access denied', async () => {
      const mockFile = createMockFile({
        uploadedBy: 'other-user',
        projectId: null,
      })
      const currentUser = createMockUser({ id: 'user-1' })

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockFileService.getFileMetadata.mockResolvedValue(mockFile)
      mockProjectService.getProjectById.mockResolvedValue(null)
      // Mock checkPermission to throw (as it does in the actual implementation)
      mockUserService.checkPermission.mockImplementation(() => {
        throw new Error('Access denied')
      })

      await expect(fileResolver.file('test-file.jpg')).rejects.toThrow(
        'Access denied'
      )
    })
  })

  describe('projectFiles', () => {
    it('should return project files when user has access', async () => {
      const mockFiles = [createMockFile()]
      const currentUser = createMockUser()
      const mockProject = createMockProject()

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(mockProject)
      mockFileService.getProjectFiles.mockResolvedValue(mockFiles)

      const result = await fileResolver.projectFiles('project-1')

      expect(result).toEqual(mockFiles)
      expect(mockProjectService.getProjectById).toHaveBeenCalledWith(
        'project-1',
        currentUser.id,
        currentUser.role
      )
      expect(mockFileService.getProjectFiles).toHaveBeenCalledWith('project-1')
    })

    it('should throw error when project not found or access denied', async () => {
      const currentUser = createMockUser()

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(null)

      await expect(fileResolver.projectFiles('project-1')).rejects.toThrow(
        'Project not found or access denied'
      )
    })
  })

  describe('userFiles', () => {
    it('should return user files when admin', async () => {
      const mockFiles = [createMockFile()]
      const currentUser = createMockUser({ role: UserRole.Admin })

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {})
      mockFileService.listFiles.mockResolvedValue(['test-file.jpg'])
      mockFileService.getFileMetadata.mockResolvedValue(createMockFile())

      const result = await fileResolver.userFiles('user-2')

      expect(result).toEqual(mockFiles)
      expect(mockUserService.checkPermission).toHaveBeenCalledWith(
        currentUser,
        UserRole.Admin
      )
    })

    it('should return own files without admin check', async () => {
      const mockFiles = [createMockFile()]
      const currentUser = createMockUser({ id: 'user-1' })

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockFileService.listFiles.mockResolvedValue(['test-file.jpg'])
      mockFileService.getFileMetadata.mockResolvedValue(createMockFile())

      const result = await fileResolver.userFiles('user-1')

      expect(result).toEqual(mockFiles)
      expect(mockUserService.checkPermission).not.toHaveBeenCalled()
    })

    it('should throw error when non-admin tries to access other user files', async () => {
      const currentUser = createMockUser({ role: UserRole.Client })

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {
        throw new Error('Access denied')
      })

      await expect(fileResolver.userFiles('user-2')).rejects.toThrow(
        'Access denied'
      )
    })
  })

  describe('uploadProjectLogo', () => {
    it('should upload project logo successfully', async () => {
      const currentUser = createMockUser()
      const mockProject = createMockProject()
      const fileBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD'
      const fileName = 'logo.jpg'
      const contentType = 'image/jpeg'

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(mockProject)
      mockFileService.uploadFile.mockResolvedValue(undefined)
      mockFileService.createProjectFileRecord.mockResolvedValue(undefined)
      mockFileService.generatePresignedDownloadUrl.mockResolvedValue(
        'https://presigned-url.com'
      )

      // Mock file-type detection
      const { fileTypeFromBuffer } = await import('file-type')
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        mime: 'image/jpeg',
        ext: 'jpg',
      })

      const result = await fileResolver.uploadProjectLogo(
        'project-1',
        fileBase64,
        fileName,
        contentType
      )

      expect(result).toBe('https://presigned-url.com')
      expect(mockFileService.uploadFile).toHaveBeenCalled()
      expect(mockProjectService.updateProject).toHaveBeenCalled()
    })

    it('should throw error when project not found', async () => {
      const currentUser = createMockUser()
      const fileBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD'
      const fileName = 'logo.jpg'
      const contentType = 'image/jpeg'

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(null)

      await expect(
        fileResolver.uploadProjectLogo(
          'project-1',
          fileBase64,
          fileName,
          contentType
        )
      ).rejects.toThrow('Project not found or access denied')
    })

    it('should throw error for invalid file type', async () => {
      const currentUser = createMockUser()
      const mockProject = createMockProject()
      const fileBase64 = 'data:text/plain;base64,SGVsbG8gV29ybGQ='
      const fileName = 'document.txt'
      const contentType = 'text/plain'

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(mockProject)

      // Mock file-type detection
      const { fileTypeFromBuffer } = await import('file-type')
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        mime: 'text/plain',
        ext: 'txt',
      })

      await expect(
        fileResolver.uploadProjectLogo(
          'project-1',
          fileBase64,
          fileName,
          contentType
        )
      ).rejects.toThrow('Invalid file upload parameters')
    })
  })

  describe('deleteFile', () => {
    it('should delete file when user has access', async () => {
      const currentUser = createMockUser()
      const mockFile = createMockFile()

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockFileService.getFileMetadata.mockResolvedValue(mockFile)
      mockProjectService.getProjectById.mockResolvedValue(createMockProject())
      mockFileService.deleteFile.mockResolvedValue(undefined)

      const result = await fileResolver.deleteFile('test-file.jpg')

      expect(result).toBe(true)
      expect(mockFileService.deleteFile).toHaveBeenCalledWith('test-file.jpg')
    })

    it('should throw error when file not found', async () => {
      const currentUser = createMockUser()

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockFileService.getFileMetadata.mockResolvedValue(null)

      await expect(
        fileResolver.deleteFile('nonexistent-file.jpg')
      ).rejects.toThrow('Not found')
    })

    it('should throw error when access denied', async () => {
      const currentUser = createMockUser({ id: 'user-1' })
      const mockFile = createMockFile({
        uploadedBy: 'other-user',
        projectId: null,
      })

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockFileService.getFileMetadata.mockResolvedValue(mockFile)
      mockProjectService.getProjectById.mockResolvedValue(null)
      // Mock checkPermission to throw (as it does in the actual implementation)
      mockUserService.checkPermission.mockImplementation(() => {
        throw new Error('Access denied')
      })

      await expect(fileResolver.deleteFile('test-file.jpg')).rejects.toThrow(
        'Access denied'
      )
    })
  })

  describe('Field Resolvers', () => {
    describe('downloadUrl', () => {
      it('should return key for assets path', async () => {
        const file = createMockFile({ key: '/assets/logo.png' })

        const result = await fileResolver.downloadUrl(file as any)

        expect(result).toBe('/assets/logo.png')
      })

      it('should return presigned URL for R2 path', async () => {
        const file = createMockFile({ key: 'dev/projects/project-1/logo.jpg' })
        const currentUser = createMockUser()

        mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
        mockProjectService.getProjectById.mockResolvedValue(createMockProject())
        mockFileService.generatePresignedDownloadUrl.mockResolvedValue(
          'https://presigned-url.com'
        )

        const result = await fileResolver.downloadUrl(file as any)

        expect(result).toBe('https://presigned-url.com')
        expect(
          mockFileService.generatePresignedDownloadUrl
        ).toHaveBeenCalledWith(file.key)
      })

      it('should throw error when access denied', async () => {
        const file = createMockFile({
          key: 'dev/projects/project-1/logo.jpg',
          uploadedBy: 'other-user',
          projectId: null,
        })
        const currentUser = createMockUser({ id: 'user-1' })

        mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
        mockProjectService.getProjectById.mockResolvedValue(null)
        // Mock checkPermission to throw (as it does in the actual implementation)
        mockUserService.checkPermission.mockImplementation(() => {
          throw new Error('Access denied')
        })

        await expect(fileResolver.downloadUrl(file as any)).rejects.toThrow(
          'Access denied'
        )
      })
    })
  })
})
