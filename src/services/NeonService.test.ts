import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createNeonProject, deleteNeonProject } from './NeonService'

const mockEnv = vi.hoisted(() => ({
  NEON_API_KEY: 'test-neon-key' as string | undefined,
}))

vi.mock('@/libs/Env', () => ({ Env: mockEnv }))

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('NeonService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnv.NEON_API_KEY = 'test-neon-key'
  })

  describe('createNeonProject', () => {
    it('should create a Neon project and return the project ID and database URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          project: { id: 'neon-project-123' },
          connection_uris: [
            { connection_uri: 'postgresql://user:pass@host/db' },
          ],
        }),
      })

      const result = await createNeonProject('my-project')

      expect(result).toEqual({
        neonProjectId: 'neon-project-123',
        databaseUrl: 'postgresql://user:pass@host/db',
      })
      expect(mockFetch).toHaveBeenCalledWith(
        'https://console.neon.tech/api/v2/projects',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-neon-key',
          }),
          body: JSON.stringify({ project: { name: 'my-project' } }),
        })
      )
    })

    it('should throw NEON_NOT_CONFIGURED when NEON_API_KEY is missing', async () => {
      mockEnv.NEON_API_KEY = undefined

      await expect(createNeonProject('my-project')).rejects.toMatchObject({
        extensions: { code: 'NEON_NOT_CONFIGURED' },
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw NEON_PROJECT_CREATION_FAILED on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: vi.fn().mockResolvedValue('{"error":"Name already taken"}'),
      })

      await expect(createNeonProject('my-project')).rejects.toMatchObject({
        extensions: { code: 'NEON_PROJECT_CREATION_FAILED' },
      })
    })

    it('should throw NEON_PROJECT_CREATION_FAILED when no connection URI is returned', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          project: { id: 'neon-project-123' },
          connection_uris: [],
        }),
      })

      await expect(createNeonProject('my-project')).rejects.toMatchObject({
        extensions: { code: 'NEON_PROJECT_CREATION_FAILED' },
      })
    })
  })

  describe('deleteNeonProject', () => {
    it('should delete a Neon project', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      await deleteNeonProject('neon-project-123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://console.neon.tech/api/v2/projects/neon-project-123',
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('should do nothing when NEON_API_KEY is missing', async () => {
      mockEnv.NEON_API_KEY = undefined

      await deleteNeonProject('neon-project-123')

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should silently ignore 404 responses', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })

      await expect(deleteNeonProject('neon-project-123')).resolves.not.toThrow()
    })

    it('should log and return (not throw) on other errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Internal server error'),
      })

      await expect(deleteNeonProject('neon-project-123')).resolves.not.toThrow()
    })
  })
})
