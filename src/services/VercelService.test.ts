import { GraphQLError } from 'graphql'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createVercelProject } from './VercelService'

vi.mock('@/libs/Env', () => ({
  Env: {
    VERCEL_TOKEN: 'test-vercel-token',
    GITHUB_ORG: 'test-org',
  },
}))

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('VercelService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createVercelProject', () => {
    it('should create a Vercel project and return the staging URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ name: 'my-project' }),
      })

      const result = await createVercelProject('my-project')

      expect(result).toBe('https://my-project.vercel.app')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vercel.com/v10/projects',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"name":"my-project"'),
        })
      )
    })

    it('should use the returned project name for the staging URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ name: 'my-project-1' }),
      })

      const result = await createVercelProject('my-project')

      expect(result).toBe('https://my-project-1.vercel.app')
    })

    it('should throw VERCEL_NOT_CONFIGURED when VERCEL_TOKEN is missing', async () => {
      vi.resetModules()
      vi.doMock('@/libs/Env', () => ({ Env: { VERCEL_TOKEN: undefined, GITHUB_ORG: 'test-org' } }))
      const { createVercelProject: create } = await import('./VercelService')

      await expect(create('my-project')).rejects.toMatchObject({
        extensions: { code: 'VERCEL_NOT_CONFIGURED' },
      })

      vi.doUnmock('@/libs/Env')
    })

    it('should throw VERCEL_PROJECT_CREATION_FAILED on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        text: vi.fn().mockResolvedValue('{"error":{"message":"Name already taken"}}'),
      })

      await expect(createVercelProject('my-project')).rejects.toThrow(GraphQLError)
      await expect(createVercelProject('my-project')).rejects.toMatchObject({
        extensions: { code: 'VERCEL_PROJECT_CREATION_FAILED' },
      })
    })

    it('should include the GitHub repo link in the request body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ name: 'my-project' }),
      })

      await createVercelProject('my-project')

      const body = JSON.parse(mockFetch.mock.calls[0]![1].body)

      expect(body.gitRepository).toEqual({
        type: 'github',
        repo: expect.stringContaining('my-project'),
      })
      expect(body.framework).toBe('nextjs')
    })
  })
})
