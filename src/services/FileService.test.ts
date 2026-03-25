import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Buffer } from 'node:buffer'
import { Readable } from 'node:stream'
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
      APP_ENV: 'dev',
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

  describe('generateProjectLogoPresignedUpload', () => {
    it('should return presigned URL, key, and metadata without S3 Metadata on command', async () => {
      mockGetSignedUrl.mockResolvedValue('https://presigned-put.example')

      const result = await fileService.generateProjectLogoPresignedUpload({
        projectId: 'project-1',
        userId: 'user-1',
        fileName: 'logo..png',
        originalFileName: 'logo..png',
        fileSize: 2048,
        contentType: 'image/png',
      })

      expect(result.uploadUrl).toBe('https://presigned-put.example')
      expect(result.key).toMatch(/^dev\/projects\/project-1\/\d+_logo\.\.png$/)
      expect(result.metadata.fileName).toBe('logo..png')
      expect(result.metadata.contentType).toBe('image/png')
      expect(result.metadata.fileSize).toBe(2048)
      expect(result.metadata.environment).toBe(Environment.DEV)

      const firstPut = vi.mocked(PutObjectCommand).mock.calls[0]

      expect(firstPut).toBeDefined()

      const putInput = firstPut![0] as {
        Bucket?: string
        ContentType?: string
        ContentLength?: number
        Metadata?: unknown
      }

      expect(putInput).toMatchObject({
        Bucket: 'test-bucket',
        ContentType: 'image/png',
        ContentLength: 2048,
      })
      expect(putInput.Metadata).toBeUndefined()
    })

    it('should use PROD environment in metadata when APP_ENV is prod', async () => {
      Object.assign(Env, { APP_ENV: 'prod' })
      mockGetSignedUrl.mockResolvedValue('https://put')
      fileService = new FileService()

      const result = await fileService.generateProjectLogoPresignedUpload({
        projectId: 'p1',
        userId: 'u1',
        fileName: 'a.png',
        originalFileName: 'a.png',
        fileSize: 100,
        contentType: 'image/png',
      })

      expect(result.metadata.environment).toBe(Environment.PROD)
      expect(result.key).toMatch(/^prod\/projects\/p1\//)

      Object.assign(Env, { APP_ENV: 'dev' })
      fileService = new FileService()
    })
  })

  describe('getObjectHeadInfo', () => {
    it('should return content length and type from HeadObject', async () => {
      mockS3Send.mockResolvedValue({
        ContentLength: 4096,
        ContentType: 'image/webp',
      })

      const result = await fileService.getObjectHeadInfo('dev/projects/p/k')

      expect(result).toEqual({
        contentLength: 4096,
        contentType: 'image/webp',
      })
    })

    it('should return null and log on S3 error', async () => {
      mockS3Send.mockRejectedValue(new Error('not found'))

      const result = await fileService.getObjectHeadInfo('missing')

      expect(result).toBeNull()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in head object:',
        expect.objectContaining({ key: 'missing' })
      )
    })
  })

  describe('getObjectBufferRange', () => {
    it('should concatenate streamed chunks into a buffer', async () => {
      const body = Readable.from([
        Buffer.from([0xff, 0xd8]),
        Buffer.from([0xff, 0xe0]),
      ])
      mockS3Send.mockResolvedValue({ Body: body })

      const result = await fileService.getObjectBufferRange('k', 8192)

      expect(result).toEqual(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))
      expect(mockS3Send).toHaveBeenCalled()
    })

    it('should return null when Body is missing', async () => {
      mockS3Send.mockResolvedValue({ Body: undefined })

      const result = await fileService.getObjectBufferRange('k', 100)

      expect(result).toBeNull()
    })

    it('should return null and log on read error', async () => {
      mockS3Send.mockRejectedValue(new Error('read failed'))

      const result = await fileService.getObjectBufferRange('k', 100)

      expect(result).toBeNull()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error reading object range:',
        expect.objectContaining({ key: 'k' })
      )
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
        ContentType: 'image/jpeg',
      })

      const result = await fileService.getFileMetadata('test-key')

      expect(mockS3Send).toHaveBeenCalled()
      expect(result).toEqual({
        fileName: 'test.jpg',
        originalFileName: 'original.jpg',
        fileSize: 1024,
        contentType: 'image/jpeg',
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
        ContentType: 'image/jpeg',
      })

      const result = await fileService.getFileMetadata('test-key')

      expect(result).toEqual({
        fileName: 'test.jpg',
        originalFileName: '',
        fileSize: 1024,
        contentType: 'image/jpeg',
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
