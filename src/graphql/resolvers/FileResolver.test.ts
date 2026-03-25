import { Buffer } from 'node:buffer'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MAX_FILE_SIZE } from '@/constants/file'
import { FileResolver } from '@/graphql/resolvers/FileResolver'
import { Environment, UserRole } from '@/graphql/schema'
import { Env } from '@/libs/Env'
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

  describe('requestProjectLogoUpload', () => {
    it('should return presigned upload payload', async () => {
      const currentUser = createMockUser()
      const mockProject = createMockProject()

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(mockProject)
      mockFileService.generateProjectLogoPresignedUpload.mockResolvedValue({
        uploadUrl: 'https://r2.example.com/put',
        key: 'dev/projects/project-1/1_logo.jpg',
        metadata: {
          key: 'dev/projects/project-1/1_logo.jpg',
          fileName: 'logo.jpg',
          originalFileName: 'logo.jpg',
          fileSize: 1024,
          contentType: 'image/jpeg',
          environment: Environment.DEV,
          uploadedAt: new Date('2024-01-01'),
        },
      })

      const result = await fileResolver.requestProjectLogoUpload(
        'project-1',
        'logo.jpg',
        'image/jpeg',
        1024
      )

      expect(result.uploadUrl).toBe('https://r2.example.com/put')
      expect(result.key).toBe('dev/projects/project-1/1_logo.jpg')
      expect(result.projectId).toBe('project-1')
      expect(
        mockFileService.generateProjectLogoPresignedUpload
      ).toHaveBeenCalled()
    })

    it('should throw when project not found', async () => {
      const currentUser = createMockUser()

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(null)

      await expect(
        fileResolver.requestProjectLogoUpload(
          'project-1',
          'logo.jpg',
          'image/jpeg',
          1024
        )
      ).rejects.toThrow('Project not found or access denied')
    })

    it('should throw when file name is empty after trim', async () => {
      const currentUser = createMockUser()
      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(createMockProject())

      await expect(
        fileResolver.requestProjectLogoUpload(
          'project-1',
          '   ',
          'image/jpeg',
          1024
        )
      ).rejects.toThrow('File name is required')
    })

    it('should throw when file size is invalid', async () => {
      const currentUser = createMockUser()
      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(createMockProject())

      await expect(
        fileResolver.requestProjectLogoUpload(
          'project-1',
          'logo.jpg',
          'image/jpeg',
          0
        )
      ).rejects.toThrow('Invalid file upload parameters')

      await expect(
        fileResolver.requestProjectLogoUpload(
          'project-1',
          'logo.jpg',
          'image/jpeg',
          MAX_FILE_SIZE + 1
        )
      ).rejects.toThrow('Invalid file upload parameters')
    })

    it('should throw when content type is not allowed', async () => {
      const currentUser = createMockUser()
      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(createMockProject())

      await expect(
        fileResolver.requestProjectLogoUpload(
          'project-1',
          'logo.jpg',
          'application/octet-stream',
          1024
        )
      ).rejects.toThrow('not allowed')
    })

    it('should normalize image/jpeg with MIME parameters before presign', async () => {
      const currentUser = createMockUser()
      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(createMockProject())
      mockFileService.generateProjectLogoPresignedUpload.mockResolvedValue({
        uploadUrl: 'https://put',
        key: 'k',
        metadata: {
          key: 'k',
          fileName: 'a.jpg',
          originalFileName: 'a.jpg',
          fileSize: 10,
          contentType: 'image/jpeg',
          environment: Environment.DEV,
          uploadedAt: new Date(),
        },
      })

      await fileResolver.requestProjectLogoUpload(
        'project-1',
        'a.jpg',
        'image/jpeg; charset=binary',
        10
      )

      expect(mockFileService.generateProjectLogoPresignedUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'image/jpeg',
        })
      )
    })
  })

  describe('finalizeProjectLogoUpload', () => {
    it('should finalize logo and return download URL', async () => {
      const currentUser = createMockUser()
      const logoKey = `${Env.APP_ENV}/projects/project-1/1_logo.jpg`
      const oldLogoKey = `${Env.APP_ENV}/projects/project-1/old.png`
      const mockProject = createMockProject({
        id: 'project-1',
        logo: oldLogoKey,
      })

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(mockProject)
      mockFileService.getObjectHeadInfo.mockResolvedValue({
        contentLength: 1024,
        contentType: 'image/jpeg',
      })
      mockFileService.getObjectBufferRange.mockResolvedValue(
        Buffer.from([0xff, 0xd8])
      )
      mockFileService.getFileMetadata.mockResolvedValue({
        key: logoKey,
        fileName: 'logo.jpg',
        originalFileName: 'logo.jpg',
        fileSize: 1024,
        contentType: 'image/jpeg',
        uploadedBy: currentUser.id,
        projectId: 'project-1',
        environment: Environment.DEV,
        uploadedAt: new Date('2024-01-01'),
      })
      mockFileService.generatePresignedDownloadUrl.mockResolvedValue(
        'https://presigned-url.com'
      )
      mockFileService.createProjectFileRecord.mockResolvedValue(undefined)
      mockFileService.deleteFile.mockResolvedValue(undefined)
      mockFileService.deleteProjectFileRecordByPath.mockResolvedValue([])

      const { fileTypeFromBuffer } = await import('file-type')
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        mime: 'image/jpeg',
        ext: 'jpg',
      })

      const result = await fileResolver.finalizeProjectLogoUpload(
        'project-1',
        logoKey
      )

      expect(result).toBe('https://presigned-url.com')
      expect(mockProjectService.updateProject).toHaveBeenCalled()
      expect(mockFileService.createProjectFileRecord).toHaveBeenCalled()
      expect(mockFileService.deleteFile).toHaveBeenCalledWith(oldLogoKey)
    })

    it('should reject key with wrong project prefix', async () => {
      const currentUser = createMockUser()
      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(createMockProject())

      await expect(
        fileResolver.finalizeProjectLogoUpload(
          'project-1',
          `${Env.APP_ENV}/projects/other-project/x.jpg`
        )
      ).rejects.toThrow('Invalid logo key')
    })

    it('should reject key with parent path segment', async () => {
      const currentUser = createMockUser()
      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(createMockProject())

      const badKey = `${Env.APP_ENV}/projects/project-1/../evil/x.jpg`

      await expect(
        fileResolver.finalizeProjectLogoUpload('project-1', badKey)
      ).rejects.toThrow('Invalid logo key')
    })

    it('should throw when object head is missing', async () => {
      const currentUser = createMockUser()
      const logoKey = `${Env.APP_ENV}/projects/project-1/k.jpg`
      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(createMockProject())
      mockFileService.getObjectHeadInfo.mockResolvedValue(null)

      await expect(
        fileResolver.finalizeProjectLogoUpload('project-1', logoKey)
      ).rejects.toThrow('Uploaded file not found or empty')
    })

    it('should throw when object is larger than max', async () => {
      const currentUser = createMockUser()
      const logoKey = `${Env.APP_ENV}/projects/project-1/k.jpg`
      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(createMockProject())
      mockFileService.getObjectHeadInfo.mockResolvedValue({
        contentLength: MAX_FILE_SIZE + 1,
        contentType: 'image/jpeg',
      })

      await expect(
        fileResolver.finalizeProjectLogoUpload('project-1', logoKey)
      ).rejects.toThrow('Invalid file upload parameters')
    })

    it('should throw when buffer range is empty', async () => {
      const currentUser = createMockUser()
      const logoKey = `${Env.APP_ENV}/projects/project-1/k.jpg`
      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(createMockProject())
      mockFileService.getObjectHeadInfo.mockResolvedValue({
        contentLength: 100,
        contentType: 'image/jpeg',
      })
      mockFileService.getObjectBufferRange.mockResolvedValue(null)

      await expect(
        fileResolver.finalizeProjectLogoUpload('project-1', logoKey)
      ).rejects.toThrow('Could not read uploaded file for validation')
    })

    it('should throw when detected type is not allowed', async () => {
      const currentUser = createMockUser()
      const logoKey = `${Env.APP_ENV}/projects/project-1/k.jpg`
      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(createMockProject())
      mockFileService.getObjectHeadInfo.mockResolvedValue({
        contentLength: 100,
        contentType: 'application/octet-stream',
      })
      mockFileService.getObjectBufferRange.mockResolvedValue(Buffer.from([1]))

      const { fileTypeFromBuffer } = await import('file-type')
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        mime: 'application/pdf',
        ext: 'pdf',
      })

      await expect(
        fileResolver.finalizeProjectLogoUpload('project-1', logoKey)
      ).rejects.toThrow('Invalid file upload parameters')
    })

    it('should throw when getFileMetadata returns null', async () => {
      const currentUser = createMockUser()
      const logoKey = `${Env.APP_ENV}/projects/project-1/k.jpg`
      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(createMockProject())
      mockFileService.getObjectHeadInfo.mockResolvedValue({
        contentLength: 100,
        contentType: 'image/jpeg',
      })
      mockFileService.getObjectBufferRange.mockResolvedValue(
        Buffer.from([0xff, 0xd8])
      )
      mockFileService.getFileMetadata.mockResolvedValue(null)

      const { fileTypeFromBuffer } = await import('file-type')
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        mime: 'image/jpeg',
        ext: 'jpg',
      })

      await expect(
        fileResolver.finalizeProjectLogoUpload('project-1', logoKey)
      ).rejects.toThrow('Could not read uploaded file metadata')
    })

    it('should not delete storage when old logo key equals new key', async () => {
      const currentUser = createMockUser()
      const logoKey = `${Env.APP_ENV}/projects/project-1/1_logo.jpg`
      const mockProject = createMockProject({
        id: 'project-1',
        logo: logoKey,
      })

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getProjectById.mockResolvedValue(mockProject)
      mockFileService.getObjectHeadInfo.mockResolvedValue({
        contentLength: 1024,
        contentType: 'image/jpeg',
      })
      mockFileService.getObjectBufferRange.mockResolvedValue(
        Buffer.from([0xff, 0xd8])
      )
      mockFileService.getFileMetadata.mockResolvedValue({
        key: logoKey,
        fileName: 'logo.jpg',
        originalFileName: 'logo.jpg',
        fileSize: 1024,
        contentType: 'image/jpeg',
        uploadedBy: currentUser.id,
        projectId: 'project-1',
        environment: Environment.DEV,
        uploadedAt: new Date('2024-01-01'),
      })
      mockFileService.generatePresignedDownloadUrl.mockResolvedValue(
        'https://presigned-url.com'
      )
      mockFileService.createProjectFileRecord.mockResolvedValue(undefined)

      const { fileTypeFromBuffer } = await import('file-type')
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        mime: 'image/jpeg',
        ext: 'jpg',
      })

      await fileResolver.finalizeProjectLogoUpload('project-1', logoKey)

      expect(mockFileService.deleteFile).not.toHaveBeenCalled()
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
