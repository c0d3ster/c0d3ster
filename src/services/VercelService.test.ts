import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createVercelProject } from './VercelService'

const mockEnv = vi.hoisted(() => ({
  VERCEL_TOKEN: 'test-vercel-token' as string | undefined,
  GITHUB_ORG: 'test-org',
}))

vi.mock('@/libs/Env', () => ({ Env: mockEnv }))

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('VercelService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createVercelProject', () => {
    it('should create a Vercel project, trigger a deployment, and return the staging URL', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ name: 'my-project' }),
        })
        .mockResolvedValueOnce({ ok: true })

      const result = await createVercelProject('my-project')

      expect(result).toBe('https://my-project.vercel.app')
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://api.vercel.com/v10/projects',
        expect.objectContaining({ method: 'POST' })
      )
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://api.vercel.com/v13/deployments',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should use the returned project name for the staging URL', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ name: 'my-project-1' }),
        })
        .mockResolvedValueOnce({ ok: true })

      const result = await createVercelProject('my-project')

      expect(result).toBe('https://my-project-1.vercel.app')
    })

    it('should throw VERCEL_NOT_CONFIGURED when VERCEL_TOKEN is missing', async () => {
      mockEnv.VERCEL_TOKEN = undefined

      await expect(createVercelProject('my-project')).rejects.toMatchObject({
        extensions: { code: 'VERCEL_NOT_CONFIGURED' },
      })

      mockEnv.VERCEL_TOKEN = 'test-vercel-token'
    })

    it('should throw VERCEL_PROJECT_CREATION_FAILED on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        text: vi.fn().mockResolvedValue('{"error":{"message":"Name already taken"}}'),
      })

      await expect(createVercelProject('my-project')).rejects.toMatchObject({
        extensions: { code: 'VERCEL_PROJECT_CREATION_FAILED' },
      })
    })

    it('should include the GitHub repo link in the project creation body', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ name: 'my-project' }),
        })
        .mockResolvedValueOnce({ ok: true })

      await createVercelProject('my-project')

      const body = JSON.parse(mockFetch.mock.calls[0]![1].body)

      expect(body.gitRepository).toEqual({
        type: 'github',
        repo: expect.stringContaining('my-project'),
      })
      expect(body.framework).toBe('nextjs')
    })

    it('should trigger deployment with correct gitSource', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ name: 'my-project' }),
        })
        .mockResolvedValueOnce({ ok: true })

      await createVercelProject('my-project')

      const deployBody = JSON.parse(mockFetch.mock.calls[1]![1].body)

      expect(deployBody.gitSource).toEqual({
        type: 'github',
        org: 'test-org',
        repo: 'my-project',
        ref: 'main',
      })
      expect(deployBody.target).toBe('production')
    })

    it('should throw VERCEL_DEPLOYMENT_FAILED when deployment trigger fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ name: 'my-project' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: vi.fn().mockResolvedValue('Bad request'),
        })

      await expect(createVercelProject('my-project')).rejects.toMatchObject({
        extensions: { code: 'VERCEL_DEPLOYMENT_FAILED' },
      })
    })
  })
})
