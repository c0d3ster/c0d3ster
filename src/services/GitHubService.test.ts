import { beforeEach, describe, expect, it, vi } from 'vitest'

import { logger } from '@/libs/Logger'

import { addRepoSecret, createRepoFromTemplate } from './GitHubService'

vi.mock('@/libs/Env', () => ({
  Env: {
    GITHUB_TOKEN: 'test-github-token',
    GITHUB_ORG: 'test-org',
    GITHUB_TEMPLATE_REPO: 'test-template',
  },
}))

// Mock libsodium-wrappers to avoid real crypto in tests
vi.mock('libsodium-wrappers', () => ({
  default: {
    ready: Promise.resolve(),
    from_base64: vi.fn().mockReturnValue(new Uint8Array(32)),
    from_string: vi.fn().mockReturnValue(new Uint8Array(16)),
    crypto_box_seal: vi.fn().mockReturnValue(new Uint8Array(48)),
    to_base64: vi.fn().mockReturnValue('encrypted-value-base64'),
    base64_variants: { ORIGINAL: 0 },
  },
}))

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

const mockRepo = {
  html_url: 'https://github.com/c0d3ster/my-project',
  name: 'my-project',
  ssh_url: 'git@github.com:c0d3ster/my-project.git',
  clone_url: 'https://github.com/c0d3ster/my-project.git',
}

const mockPublicKey = { key: 'base64-public-key', key_id: 'key-id-123' }

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
      vi.resetModules()
      vi.doMock('@/libs/Env', () => ({ Env: { GITHUB_TOKEN: undefined, GITHUB_ORG: 'test-org', GITHUB_TEMPLATE_REPO: 'test-template' } }))
      const { createRepoFromTemplate: create } = await import('./GitHubService')

      await expect(create('my-project')).rejects.toMatchObject({
        extensions: { code: 'GITHUB_NOT_CONFIGURED' },
      })

      vi.doUnmock('@/libs/Env')
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

  describe('addRepoSecret', () => {
    it('should fetch the public key, encrypt, and PUT the secret', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockPublicKey),
        })
        .mockResolvedValueOnce({ ok: true, status: 204 })

      await addRepoSecret('my-project', 'MY_SECRET', 'secret-value')

      expect(mockFetch).toHaveBeenCalledTimes(2)

      const [secretUrl, secretOptions] = mockFetch.mock.calls[1]!

      expect(secretUrl).toContain('/actions/secrets/MY_SECRET')
      expect(secretOptions.method).toBe('PUT')

      const body = JSON.parse(secretOptions.body)

      expect(body.encrypted_value).toBe('encrypted-value-base64')
      expect(body.key_id).toBe('key-id-123')
    })

    it('should succeed with a 201 response', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockPublicKey),
        })
        .mockResolvedValueOnce({ ok: false, status: 201 })

      await expect(
        addRepoSecret('my-project', 'MY_SECRET', 'value')
      ).resolves.toBeUndefined()
    })

    it('should succeed with a 204 response', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockPublicKey),
        })
        .mockResolvedValueOnce({ ok: false, status: 204 })

      await expect(
        addRepoSecret('my-project', 'MY_SECRET', 'value')
      ).resolves.toBeUndefined()
    })

    it('should throw GITHUB_SECRET_ADD_FAILED on PUT failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockPublicKey),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 422,
          text: vi.fn().mockResolvedValue('Unprocessable entity'),
        })

      await expect(
        addRepoSecret('my-project', 'MY_SECRET', 'value')
      ).rejects.toMatchObject({
        extensions: { code: 'GITHUB_SECRET_ADD_FAILED' },
      })
    })

    it('should retry on 404 from public key endpoint and succeed', async () => {
      vi.useFakeTimers()

      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockPublicKey),
        })
        .mockResolvedValueOnce({ ok: true, status: 204 })

      const promise = addRepoSecret('my-project', 'MY_SECRET', 'value')
      const assertion = expect(promise).resolves.toBeUndefined()
      await vi.runAllTimersAsync()
      await assertion

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'Repo not ready yet, retrying...',
        expect.any(Object)
      )

      vi.useRealTimers()
    })

    it('should throw GITHUB_SECRET_KEY_FETCH_FAILED after all retries exhausted', async () => {
      vi.useFakeTimers()

      mockFetch.mockResolvedValue({ ok: false, status: 404 })

      const promise = addRepoSecret('my-project', 'MY_SECRET', 'value')
      const assertion = expect(promise).rejects.toMatchObject({
        extensions: { code: 'GITHUB_SECRET_KEY_FETCH_FAILED' },
      })
      await vi.runAllTimersAsync()
      await assertion

      vi.useRealTimers()
    })

    it('should throw GITHUB_SECRET_KEY_FETCH_FAILED on non-404 public key error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        text: vi.fn().mockResolvedValue('Forbidden'),
      })

      await expect(
        addRepoSecret('my-project', 'MY_SECRET', 'value')
      ).rejects.toMatchObject({
        extensions: { code: 'GITHUB_SECRET_KEY_FETCH_FAILED' },
      })

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'Failed to fetch repo public key',
        expect.objectContaining({ status: 403 })
      )
    })
  })
})
