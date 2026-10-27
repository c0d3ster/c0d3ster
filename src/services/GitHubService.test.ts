import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { logger } from '@/libs/Logger'

import { bootstrapRepo, createRepoFromTemplate } from './GitHubService'

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

  describe('bootstrapRepo', () => {
    const publicKey = {
      key_id: 'key-1',
      key: 'EXZEoZj8dYa2fvhH/Hq0HtRrBvvg4ukzOwFy8fiBm3k=',
    }
    const okResponse = (body: unknown = {}) => ({
      ok: true,
      json: vi.fn().mockResolvedValue(body),
    })

    beforeEach(() => {
      vi.useFakeTimers()
      mockFetch.mockReset()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    const run = async (features: string[] = ['database', 'auth']) => {
      const promise = bootstrapRepo('my-project', features)
      // Attach the handler before timers advance so a rejection is never unhandled
      const settled = promise.then(
        () => undefined,
        (error: unknown) => error
      )
      await vi.advanceTimersByTimeAsync(60_000)
      return { promise, settled }
    }

    it('should set the push secret then dispatch the workflow, without waiting for it', async () => {
      mockFetch
        .mockResolvedValueOnce(okResponse(publicKey))
        .mockResolvedValueOnce(okResponse())
        .mockResolvedValueOnce(okResponse())

      const { promise } = await run()

      await expect(promise).resolves.toBeUndefined()
      expect(mockFetch).toHaveBeenCalledTimes(3)

      const [keyUrl] = mockFetch.mock.calls[0]!
      const [secretUrl, secretOptions] = mockFetch.mock.calls[1]!
      const [dispatchUrl, dispatchOptions] = mockFetch.mock.calls[2]!
      const repoUrl = 'https://api.github.com/repos/test-org/my-project'

      expect(keyUrl).toBe(`${repoUrl}/actions/secrets/public-key`)
      expect(secretUrl).toBe(`${repoUrl}/actions/secrets/BOOTSTRAP_TOKEN`)
      expect(secretOptions.method).toBe('PUT')

      const secretBody = JSON.parse(secretOptions.body)

      expect(secretBody.key_id).toBe('key-1')
      expect(secretBody.encrypted_value).not.toContain('test-github-token')

      expect(dispatchUrl).toBe(
        `${repoUrl}/actions/workflows/bootstrap.yml/dispatches`
      )
      expect(dispatchOptions.method).toBe('POST')
      expect(JSON.parse(dispatchOptions.body)).toEqual({
        ref: 'main',
        inputs: { features: 'database,auth' },
      })
    })

    it('should send an empty features input when none are selected', async () => {
      mockFetch
        .mockResolvedValueOnce(okResponse(publicKey))
        .mockResolvedValueOnce(okResponse())
        .mockResolvedValueOnce(okResponse())

      const { promise } = await run([])

      await promise

      expect(JSON.parse(mockFetch.mock.calls[2]![1].body).inputs).toEqual({
        features: '',
      })
    })

    it('should retry while the new repo is not reachable yet', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce(okResponse(publicKey))
        .mockResolvedValueOnce(okResponse())
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce(okResponse())

      const { promise } = await run()

      await expect(promise).resolves.toBeUndefined()
      expect(mockFetch).toHaveBeenCalledTimes(5)
    })

    it('should throw GITHUB_BOOTSTRAP_FAILED when a request is rejected', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        text: vi.fn().mockResolvedValue('{"message":"forbidden"}'),
      })

      const { settled } = await run()

      await expect(settled).resolves.toMatchObject({
        extensions: { code: 'GITHUB_BOOTSTRAP_FAILED' },
      })
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should give up with GITHUB_BOOTSTRAP_FAILED when the repo never becomes reachable', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        text: vi.fn().mockResolvedValue('Not Found'),
      })

      const { settled } = await run()

      await expect(settled).resolves.toMatchObject({
        extensions: { code: 'GITHUB_BOOTSTRAP_FAILED' },
      })
      expect(mockFetch).toHaveBeenCalledTimes(6)
    })

    it('should throw GITHUB_NOT_CONFIGURED when GITHUB_TOKEN is missing', async () => {
      mockEnv.GITHUB_TOKEN = undefined

      await expect(bootstrapRepo('my-project', [])).rejects.toMatchObject({
        extensions: { code: 'GITHUB_NOT_CONFIGURED' },
      })

      mockEnv.GITHUB_TOKEN = 'test-github-token'
    })
  })
})
