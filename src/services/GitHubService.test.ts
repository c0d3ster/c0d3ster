import { beforeEach, describe, expect, it, vi } from 'vitest'

import { logger } from '@/libs/Logger'

import { createRepoFromTemplate } from './GitHubService'

const mockEnv = vi.hoisted(() => ({
  GITHUB_TOKEN: 'test-github-token' as string | undefined,
  GITHUB_ORG: 'test-org',
  GITHUB_TEMPLATE_REPO: 'test-template',
}))

vi.mock('@/libs/Env', () => ({ Env: mockEnv }))

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

const mockRepo = {
  html_url: 'https://github.com/c0d3ster/my-project',
  name: 'my-project',
  ssh_url: 'git@github.com:c0d3ster/my-project.git',
  clone_url: 'https://github.com/c0d3ster/my-project.git',
}

describe('GitHubService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createRepoFromTemplate', () => {
    it('should create a repo and return the repo data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockRepo),
      })

      const result = await createRepoFromTemplate('my-project', 'A test project')

      expect(result).toEqual(mockRepo)
    })

    it('should POST to the correct GitHub generate endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockRepo),
      })

      await createRepoFromTemplate('my-project')

      const [url, options] = mockFetch.mock.calls[0]!

      expect(url).toContain('/generate')
      expect(options.method).toBe('POST')
      expect(options.headers.Authorization).toMatch(/^Bearer /)
      expect(options.headers.Accept).toBe('application/vnd.github+json')
    })

    it('should include correct body fields', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockRepo),
      })

      await createRepoFromTemplate('my-project', 'Custom description')

      const body = JSON.parse(mockFetch.mock.calls[0]![1].body)

      expect(body.name).toBe('my-project')
      expect(body.private).toBe(true)
      expect(body.description).toBe('Custom description')
      expect(body.include_all_branches).toBe(false)
    })

    it('should use a default description when none is provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockRepo),
      })

      await createRepoFromTemplate('my-project')

      const body = JSON.parse(mockFetch.mock.calls[0]![1].body)

      expect(body.description).toContain('my-project')
    })

    it('should throw GITHUB_NOT_CONFIGURED when GITHUB_TOKEN is missing', async () => {
      mockEnv.GITHUB_TOKEN = undefined

      await expect(createRepoFromTemplate('my-project')).rejects.toMatchObject({
        extensions: { code: 'GITHUB_NOT_CONFIGURED' },
      })

      mockEnv.GITHUB_TOKEN = 'test-github-token'
    })

    it('should throw GITHUB_REPO_CREATION_FAILED on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        text: vi.fn().mockResolvedValue('{"message":"Repository already exists"}'),
      })

      await expect(createRepoFromTemplate('my-project')).rejects.toMatchObject({
        extensions: { code: 'GITHUB_REPO_CREATION_FAILED' },
      })

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'GitHub repo creation failed',
        expect.objectContaining({ status: 422 })
      )
    })
  })
})
