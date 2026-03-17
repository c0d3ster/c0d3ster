import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  addVercelEnvVar,
  createVercelProject,
  triggerVercelDeployment,
} from './VercelService'

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
    it('should create a Vercel project and return the staging URL without triggering deployment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ name: 'my-project' }),
      })

      const result = await createVercelProject('my-project')

      expect(result).toBe('https://my-project.vercel.app')
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vercel.com/v10/projects',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should use the returned project name for the staging URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ name: 'my-project-1' }),
      })

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
      mockFetch.mockResolvedValueOnce({
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

  describe('triggerVercelDeployment', () => {
    it('should trigger a deployment with correct gitSource', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      await triggerVercelDeployment('my-project')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vercel.com/v13/deployments',
        expect.objectContaining({ method: 'POST' })
      )

      const body = JSON.parse(mockFetch.mock.calls[0]![1].body)

      expect(body.gitSource).toEqual({
        type: 'github',
        org: 'test-org',
        repo: 'my-project',
        ref: 'main',
      })
      expect(body.target).toBe('production')
    })

    it('should throw VERCEL_NOT_CONFIGURED when VERCEL_TOKEN is missing', async () => {
      mockEnv.VERCEL_TOKEN = undefined

      await expect(triggerVercelDeployment('my-project')).rejects.toMatchObject({
        extensions: { code: 'VERCEL_NOT_CONFIGURED' },
      })

      mockEnv.VERCEL_TOKEN = 'test-vercel-token'
    })

    it('should throw VERCEL_DEPLOYMENT_FAILED when deployment trigger fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('Bad request'),
      })

      await expect(triggerVercelDeployment('my-project')).rejects.toMatchObject({
        extensions: { code: 'VERCEL_DEPLOYMENT_FAILED' },
      })
    })
  })

  describe('addVercelEnvVar', () => {
    it('should add an env var to a Vercel project with all targets by default', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      await addVercelEnvVar('my-project', 'DATABASE_URL', 'postgresql://...')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vercel.com/v10/projects/my-project/env',
        expect.objectContaining({ method: 'POST' })
      )

      const body = JSON.parse(mockFetch.mock.calls[0]![1].body)

      expect(body).toEqual({
        key: 'DATABASE_URL',
        value: 'postgresql://...',
        type: 'encrypted',
        target: ['production', 'preview', 'development'],
      })
    })

    it('should support custom targets', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      await addVercelEnvVar('my-project', 'SOME_KEY', 'value', ['production'])

      const body = JSON.parse(mockFetch.mock.calls[0]![1].body)

      expect(body.target).toEqual(['production'])
    })

    it('should throw VERCEL_NOT_CONFIGURED when VERCEL_TOKEN is missing', async () => {
      mockEnv.VERCEL_TOKEN = undefined

      await expect(
        addVercelEnvVar('my-project', 'DATABASE_URL', 'value')
      ).rejects.toMatchObject({
        extensions: { code: 'VERCEL_NOT_CONFIGURED' },
      })

      mockEnv.VERCEL_TOKEN = 'test-vercel-token'
    })

    it('should throw VERCEL_ENV_VAR_FAILED on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('Bad request'),
      })

      await expect(
        addVercelEnvVar('my-project', 'DATABASE_URL', 'value')
      ).rejects.toMatchObject({
        extensions: { code: 'VERCEL_ENV_VAR_FAILED' },
      })
    })
  })
})
