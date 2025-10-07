import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apolloClient } from '@/libs/ApolloClient'

import {
  DELETE_FILE,
  deleteFile,
  GET_FILE,
  GET_FILES,
  UPLOAD_PROJECT_LOGO,
  uploadProjectLogo,
  useDeleteFile,
  useGetFile,
  useGetFiles,
  useUploadProjectLogo,
} from './fileApiClient'

// Mock Apollo Client
vi.mock('@/libs/ApolloClient', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn(),
  },
}))

// Mock the generated GraphQL hooks
vi.mock('@/graphql/generated/graphql', () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}))

describe('File API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GraphQL Operations', () => {
    it('should define all GraphQL operations', () => {
      expect(UPLOAD_PROJECT_LOGO).toBeDefined()
      expect(GET_FILES).toBeDefined()
      expect(GET_FILE).toBeDefined()
      expect(DELETE_FILE).toBeDefined()

      expect(UPLOAD_PROJECT_LOGO.definitions.length).toBeGreaterThan(0)
      expect(GET_FILES.definitions.length).toBeGreaterThan(0)
      expect(GET_FILE.definitions.length).toBeGreaterThan(0)
      expect(DELETE_FILE.definitions.length).toBeGreaterThan(0)
    })
  })

  describe('Hooks', () => {
    it('should export all required hooks', () => {
      expect(useUploadProjectLogo).toBeDefined()
      expect(useDeleteFile).toBeDefined()
      expect(useGetFiles).toBeDefined()
      expect(useGetFile).toBeDefined()

      expect(typeof useUploadProjectLogo).toBe('function')
      expect(typeof useDeleteFile).toBe('function')
      expect(typeof useGetFiles).toBe('function')
      expect(typeof useGetFile).toBe('function')
    })
  })

  describe('Async Functions', () => {
    describe('uploadProjectLogo', () => {
      it('should successfully upload project logo', async () => {
        const mockProjectId = 'project-1'
        const mockFile = 'base64data'
        const mockFileName = 'logo.png'
        const mockContentType = 'image/png'
        const mockResponse = {
          data: {
            uploadProjectLogo: 'uploaded-file-key',
          },
        }

        vi.mocked(apolloClient.mutate).mockResolvedValue(mockResponse)

        const result = await uploadProjectLogo(
          mockProjectId,
          mockFile,
          mockFileName,
          mockContentType
        )

        expect(apolloClient.mutate).toHaveBeenCalledWith({
          mutation: UPLOAD_PROJECT_LOGO,
          variables: {
            projectId: mockProjectId,
            file: mockFile,
            fileName: mockFileName,
            contentType: mockContentType,
          },
        })
        expect(result).toBe('uploaded-file-key')
      })

      it('should throw error when apollo client returns error', async () => {
        const mockProjectId = 'project-1'
        const mockFile = 'base64data'
        const mockFileName = 'logo.png'
        const mockContentType = 'image/png'
        const error = new Error('Upload failed')

        vi.mocked(apolloClient.mutate).mockResolvedValue({ error } as any)

        await expect(
          uploadProjectLogo(
            mockProjectId,
            mockFile,
            mockFileName,
            mockContentType
          )
        ).rejects.toThrow('Upload failed')
      })

      it('should return undefined when no data is returned', async () => {
        const mockProjectId = 'project-1'
        const mockFile = 'base64data'
        const mockFileName = 'logo.png'
        const mockContentType = 'image/png'
        const mockResponse = {
          data: null,
        }

        vi.mocked(apolloClient.mutate).mockResolvedValue(mockResponse)

        const result = await uploadProjectLogo(
          mockProjectId,
          mockFile,
          mockFileName,
          mockContentType
        )

        expect(result).toBeUndefined()
      })
    })

    describe('deleteFile', () => {
      it('should successfully delete file', async () => {
        const mockKey = 'file-key-123'
        const mockResponse = {
          data: {
            deleteFile: true,
          },
        }

        vi.mocked(apolloClient.mutate).mockResolvedValue(mockResponse)

        const result = await deleteFile(mockKey)

        expect(apolloClient.mutate).toHaveBeenCalledWith({
          mutation: DELETE_FILE,
          variables: { key: mockKey },
        })
        expect(result).toBe(true)
      })

      it('should throw error when apollo client returns error', async () => {
        const mockKey = 'file-key-123'
        const error = new Error('Delete failed')

        vi.mocked(apolloClient.mutate).mockResolvedValue({ error } as any)

        await expect(deleteFile(mockKey)).rejects.toThrow('Delete failed')
      })

      it('should throw error when no response is returned', async () => {
        const mockKey = 'file-key-123'
        const mockResponse = {
          data: {
            deleteFile: null,
          },
        }

        vi.mocked(apolloClient.mutate).mockResolvedValue(mockResponse)

        await expect(deleteFile(mockKey)).rejects.toThrow(
          'No response from DeleteFile mutation'
        )
      })
    })
  })
})
