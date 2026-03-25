import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apolloClient } from '@/libs/ApolloClient'

import {
  DELETE_FILE,
  deleteFile,
  FINALIZE_PROJECT_LOGO_UPLOAD,
  GET_FILE,
  GET_FILES,
  REQUEST_PROJECT_LOGO_UPLOAD,
  uploadProjectLogo,
  useDeleteFile,
  useFinalizeProjectLogoUpload,
  useGetFile,
  useGetFiles,
  useRequestProjectLogoUpload,
} from './fileApiClient'

vi.mock('@/libs/ApolloClient', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn(),
  },
}))

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
      expect(REQUEST_PROJECT_LOGO_UPLOAD).toBeDefined()
      expect(FINALIZE_PROJECT_LOGO_UPLOAD).toBeDefined()
      expect(GET_FILES).toBeDefined()
      expect(GET_FILE).toBeDefined()
      expect(DELETE_FILE).toBeDefined()

      expect(REQUEST_PROJECT_LOGO_UPLOAD.definitions.length).toBeGreaterThan(0)
      expect(FINALIZE_PROJECT_LOGO_UPLOAD.definitions.length).toBeGreaterThan(0)
      expect(GET_FILES.definitions.length).toBeGreaterThan(0)
      expect(GET_FILE.definitions.length).toBeGreaterThan(0)
      expect(DELETE_FILE.definitions.length).toBeGreaterThan(0)
    })
  })

  describe('Hooks', () => {
    it('should export all required hooks', () => {
      expect(useRequestProjectLogoUpload).toBeDefined()
      expect(useFinalizeProjectLogoUpload).toBeDefined()
      expect(useDeleteFile).toBeDefined()
      expect(useGetFiles).toBeDefined()
      expect(useGetFile).toBeDefined()

      expect(typeof useRequestProjectLogoUpload).toBe('function')
      expect(typeof useFinalizeProjectLogoUpload).toBe('function')
      expect(typeof useDeleteFile).toBe('function')
      expect(typeof useGetFiles).toBe('function')
      expect(typeof useGetFile).toBe('function')
    })
  })

  describe('Async Functions', () => {
    describe('uploadProjectLogo', () => {
      it('should request presigned URL, PUT file, then finalize', async () => {
        const mockProjectId = 'project-1'
        const mockFile = new File(['x'], 'logo.png', { type: 'image/png' })

        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
        })

        vi.mocked(apolloClient.mutate)
          .mockResolvedValueOnce({
            data: {
              requestProjectLogoUpload: {
                uploadUrl: 'https://r2.example/put',
                key: 'dev/projects/project-1/k.png',
                projectId: mockProjectId,
                metadata: {
                  key: 'dev/projects/project-1/k.png',
                  fileName: 'logo.png',
                  originalFileName: 'logo.png',
                  fileSize: 1,
                  contentType: 'image/png',
                  environment: 'DEV',
                  uploadedAt: '2024-01-01T00:00:00.000Z',
                },
              },
            },
          })
          .mockResolvedValueOnce({
            data: {
              finalizeProjectLogoUpload: 'https://download.example/logo',
            },
          })

        const result = await uploadProjectLogo(mockProjectId, mockFile)

        expect(apolloClient.mutate).toHaveBeenNthCalledWith(1, {
          mutation: REQUEST_PROJECT_LOGO_UPLOAD,
          variables: {
            projectId: mockProjectId,
            fileName: 'logo.png',
            contentType: 'image/png',
            fileSize: mockFile.size,
          },
        })
        expect(globalThis.fetch).toHaveBeenCalledWith(
          'https://r2.example/put',
          expect.objectContaining({
            method: 'PUT',
            body: mockFile,
          })
        )
        expect(apolloClient.mutate).toHaveBeenNthCalledWith(2, {
          mutation: FINALIZE_PROJECT_LOGO_UPLOAD,
          variables: {
            projectId: mockProjectId,
            key: 'dev/projects/project-1/k.png',
          },
        })
        expect(result).toBe('https://download.example/logo')
      })

      it('should throw error when first mutation returns error', async () => {
        const mockFile = new File(['x'], 'logo.png', { type: 'image/png' })
        const error = new Error('Request failed')

        vi.mocked(apolloClient.mutate).mockResolvedValue({ error } as any)

        await expect(uploadProjectLogo('project-1', mockFile)).rejects.toThrow(
          'Request failed'
        )
      })

      it('should throw when presigned request returns no data', async () => {
        const mockFile = new File(['x'], 'logo.png', { type: 'image/png' })

        vi.mocked(apolloClient.mutate).mockResolvedValueOnce({
          data: null,
        })

        await expect(uploadProjectLogo('project-1', mockFile)).rejects.toThrow(
          'Failed to get upload URL'
        )
      })

      it('should throw when PUT to R2 fails', async () => {
        const mockFile = new File(['x'], 'logo.png', { type: 'image/png' })

        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
        })

        vi.mocked(apolloClient.mutate).mockResolvedValueOnce({
          data: {
            requestProjectLogoUpload: {
              uploadUrl: 'https://r2.example/put',
              key: 'k',
              projectId: 'project-1',
              metadata: {},
            },
          },
        })

        await expect(uploadProjectLogo('project-1', mockFile)).rejects.toThrow(
          'Direct upload failed: 403 Forbidden'
        )
      })

      it('should return undefined when finalize returns no data', async () => {
        const mockFile = new File(['x'], 'logo.png', { type: 'image/png' })

        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
        })

        vi.mocked(apolloClient.mutate)
          .mockResolvedValueOnce({
            data: {
              requestProjectLogoUpload: {
                uploadUrl: 'https://r2.example/put',
                key: 'k',
                projectId: 'project-1',
                metadata: {},
              },
            },
          })
          .mockResolvedValueOnce({
            data: null,
          })

        const result = await uploadProjectLogo('project-1', mockFile)

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
