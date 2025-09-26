import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Buffer } from 'node:buffer'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Environment } from '@/graphql/schema'
import { db } from '@/libs/DB'
import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'

import { FileService } from './FileService'

// Mock AWS SDK
let mockS3Send: any
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: mockS3Send,
  })),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
  HeadObjectCommand: vi.fn(),
  ListObjectsV2Command: vi.fn(),
}))

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(),
}))

vi.mock('@/libs/Env', () => ({
  Env: {
    R2_ACCOUNT_ID: 'test-account-id',
    R2_ACCESS_KEY_ID: 'test-access-key',
    R2_SECRET_ACCESS_KEY: 'test-secret-key',
    R2_BUCKET_NAME: 'test-bucket',
  },
}))

describe('FileService', () => {
  let fileService: FileService
  const mockDbInsert = vi.mocked(db.insert)
  const mockDbDelete = vi.mocked(db.delete)
  const mockDbQuery = vi.mocked(db.query.projectFiles)
  const mockLogger = vi.mocked(logger)
  const mockGetSignedUrl = vi.mocked(getSignedUrl)

  const mockFileInput = {
    fileName: 'test-file.jpg',
    originalFileName: 'original-test-file.jpg',
    fileSize: 1024,
    contentType: 'image/jpeg',
    projectId: 'project-123',
    uploadedBy: 'user-123',
    environment: Environment.DEV,
    userId: 'user-123',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Ensure all required env vars are set before creating FileService
    Object.assign(Env, {
      R2_ACCOUNT_ID: 'test-account-id',
      R2_ACCESS_KEY_ID: 'test-access-key',
      R2_SECRET_ACCESS_KEY: 'test-secret-key',
      R2_BUCKET_NAME: 'test-bucket',
    })
    // Initialize mockS3Send before creating FileService
    mockS3Send = vi.fn()
    fileService = new FileService()
  })

  describe('constructor', () => {
    it('should initialize with environment variables', () => {
      expect(fileService).toBeInstanceOf(FileService)
    })

    it('should throw error if environment variables are missing', () => {
      const originalEnv = { ...Env }

      // Clear required env vars
      delete (Env as any).R2_ACCOUNT_ID

      expect(() => new FileService()).toThrow(
        'R2 environment variables are required'
      )

      // Restore original env
      Object.assign(Env, originalEnv)
    })
  })

  describe('generatePresignedUploadUrl', () => {
    it('should generate presigned URL for project file', async () => {
      mockGetSignedUrl.mockResolvedValue('https://signed-url.com')

      const result = await fileService.generatePresignedUploadUrl(mockFileInput)

      expect(result.uploadUrl).toBe('https://signed-url.com')
      expect(result.key).toMatch(
        /dev\/projects\/project-123\/\d+_test-file\.jpg/
      )
      expect(result.metadata).toEqual({
        fileName: mockFileInput.fileName,
        originalFileName: mockFileInput.originalFileName,
        fileSize: mockFileInput.fileSize,
        contentType: mockFileInput.contentType,
        projectId: mockFileInput.projectId,
        uploadedBy: mockFileInput.uploadedBy,
        environment: mockFileInput.environment,
        uploadedAt: expect.any(Date),
        key: expect.stringMatching(
          /dev\/projects\/project-123\/\d+_test-file\.jpg/
        ),
      })
    })

    it('should generate presigned URL for user file', async () => {
      const { projectId, ...userFileInput } = mockFileInput
      mockGetSignedUrl.mockResolvedValue('https://signed-url.com')

      const result = await fileService.generatePresignedUploadUrl(userFileInput)

      expect(result.uploadUrl).toBe('https://signed-url.com')
      expect(result.key).toMatch(/dev\/users\/user-123\/\d+_test-file\.jpg/)
      expect(result.metadata.projectId).toBeUndefined()
    })

    it('should sanitize file names', async () => {
      const fileWithSpaces = {
        ...mockFileInput,
        fileName: 'test file with spaces & special chars!.jpg',
      }
      mockGetSignedUrl.mockResolvedValue('https://signed-url.com')

      const result =
        await fileService.generatePresignedUploadUrl(fileWithSpaces)

      expect(result.key).toMatch(/test_file_with_spaces___special_chars_\.jpg/)
    })
  })

  describe('generateProjectFileUploadUrl', () => {
    it('should create database record and return upload URL', async () => {
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'file-123' }]),
        }),
      } as any)

      const result = await fileService.generateProjectFileUploadUrl({
        ...mockFileInput,
        isClientVisible: true,
        description: 'Test file',
      })

      expect(mockDbInsert).toHaveBeenCalled()
      expect(result).toHaveProperty('uploadUrl')
      expect(result).toHaveProperty('key')
    })

    it('should not create database record for non-project files', async () => {
      const { projectId, ...userFileInput } = mockFileInput

      await fileService.generateProjectFileUploadUrl(userFileInput)

      expect(mockDbInsert).not.toHaveBeenCalled()
    })
  })

  describe('generatePresignedDownloadUrl', () => {
    it('should generate presigned download URL', async () => {
      const expectedUrl = 'https://download-url.com'
      mockGetSignedUrl.mockResolvedValue(expectedUrl)

      const result = await fileService.generatePresignedDownloadUrl('test-key')

      expect(mockGetSignedUrl).toHaveBeenCalled()
      expect(result).toBe(expectedUrl)
    })
  })

  describe('deleteFile', () => {
    it('should delete file from storage', async () => {
      mockS3Send.mockResolvedValue({})

      await fileService.deleteFile('test-key')

      expect(mockS3Send).toHaveBeenCalled()
    })
  })

  describe('uploadFile', () => {
    it('should upload file to storage', async () => {
      const fileBuffer = Buffer.from('test file content')
      mockS3Send.mockResolvedValue({})

      await fileService.uploadFile('test-key', fileBuffer, 'image/jpeg', {
        author: 'test-user',
      })

      expect(mockS3Send).toHaveBeenCalled()
    })
  })

  describe('listFiles', () => {
    it('should list files from storage', async () => {
      const mockFiles = [
        { Key: 'prefix/file1.jpg' },
        { Key: 'prefix/file2.png' },
      ]
      mockS3Send.mockResolvedValue({
        Contents: mockFiles,
      })

      const result = await fileService.listFiles('prefix/')

      expect(mockS3Send).toHaveBeenCalled()
      expect(result).toEqual(['prefix/file1.jpg', 'prefix/file2.png'])
    })

    it('should return empty array when no files found', async () => {
      mockS3Send.mockResolvedValue({
        Contents: [],
      })

      const result = await fileService.listFiles('prefix/')

      expect(mockS3Send).toHaveBeenCalled()
      expect(result).toEqual([])
    })

    it('should handle undefined Contents', async () => {
      mockS3Send.mockResolvedValue({})

      const result = await fileService.listFiles('prefix/')

      expect(result).toEqual([])
    })
  })

  describe('getFileMetadata', () => {
    it('should parse metadata from S3 object', async () => {
      const mockMetadata = {
        fileName: 'test.jpg',
        originalFileName: 'original.jpg',
        fileSize: '1024',
        contentType: 'image/jpeg',
        projectId: 'project-123',
        uploadedBy: 'user-123',
        environment: 'DEV',
        uploadedAt: '2023-01-01T00:00:00.000Z',
      }
      mockS3Send.mockResolvedValue({
        Metadata: mockMetadata,
      })

      const result = await fileService.getFileMetadata('test-key')

      expect(mockS3Send).toHaveBeenCalled()
      expect(result).toEqual({
        fileName: 'test.jpg',
        originalFileName: 'original.jpg',
        fileSize: 1024,
        contentType: '',
        projectId: 'project-123',
        uploadedBy: 'user-123',
        environment: 'DEV',
        uploadedAt: new Date('2023-01-01T00:00:00.000Z'),
        key: 'test-key',
      })
    })

    it('should handle missing metadata gracefully', async () => {
      mockS3Send.mockResolvedValue({
        Metadata: {
          fileName: 'test.jpg',
          fileSize: '1024',
          contentType: 'image/jpeg',
          uploadedBy: 'user-123',
          environment: 'DEV',
        },
      })

      const result = await fileService.getFileMetadata('test-key')

      expect(result).toEqual({
        fileName: 'test.jpg',
        originalFileName: '',
        fileSize: 1024,
        contentType: '',
        projectId: undefined,
        uploadedBy: 'user-123',
        environment: 'DEV',
        uploadedAt: expect.any(Date),
        key: 'test-key',
      })
    })

    it('should return null on error', async () => {
      mockS3Send.mockRejectedValue(new Error('S3 error'))

      const result = await fileService.getFileMetadata('test-key')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error getting file metadata:',
        { error: expect.any(Error) }
      )
      expect(result).toBeNull()
    })
  })

  describe('createProjectFileRecord', () => {
    it('should create project file record', async () => {
      const mockRecord = { id: 'file-123', fileName: 'test.jpg' }
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockRecord]),
        }),
      } as any)

      const result = await fileService.createProjectFileRecord({
        fileName: 'test.jpg',
        originalFileName: 'original.jpg',
        filePath: 'path/to/file.jpg',
        fileSize: 1024,
        contentType: 'image/jpeg',
        projectId: 'project-123',
        uploadedBy: 'user-123',
        isClientVisible: true,
        description: 'Test file',
      })

      expect(mockDbInsert).toHaveBeenCalled()
      expect(result).toEqual(mockRecord)
    })
  })

  describe('deleteProjectFileRecordByPath', () => {
    it('should delete project file record by path', async () => {
      const mockDeletedRecords = [{ id: 'file-123', fileName: 'test.jpg' }]
      mockDbDelete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockDeletedRecords),
        }),
      } as any)

      const result =
        await fileService.deleteProjectFileRecordByPath('path/to/file.jpg')

      expect(result).toEqual(mockDeletedRecords)
    })
  })

  describe('getProjectFiles', () => {
    it('should return project files', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          fileName: 'file1.jpg',
          createdAt: new Date(),
          description: null,
          isClientVisible: true,
          projectId: 'project-123',
          originalFileName: 'file1.jpg',
          contentType: 'image/jpeg',
          fileSize: 1024,
          filePath: 'path/to/file1.jpg',
          uploadedBy: 'user-123',
        },
        {
          id: 'file-2',
          fileName: 'file2.png',
          createdAt: new Date(),
          description: null,
          isClientVisible: true,
          projectId: 'project-123',
          originalFileName: 'file2.png',
          contentType: 'image/png',
          fileSize: 2048,
          filePath: 'path/to/file2.png',
          uploadedBy: 'user-123',
        },
      ]
      mockDbQuery.findMany.mockResolvedValue(mockFiles)

      const result = await fileService.getProjectFiles('project-123')

      expect(mockDbQuery.findMany).toHaveBeenCalled()
      expect(result).toEqual(mockFiles)
    })
  })

  describe('deleteProjectFileRecord', () => {
    it('should delete project file record by ID', async () => {
      mockDbDelete.mockReturnValue({
        where: vi.fn(),
      } as any)

      await fileService.deleteProjectFileRecord('file-123')

      expect(mockDbDelete).toHaveBeenCalled()
    })
  })
})
