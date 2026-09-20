import { GraphQLError } from 'graphql'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectFeature, ProjectType } from '@/graphql/schema'
import { logger } from '@/libs/Logger'

import { ProjectInferenceService } from './ProjectInferenceService'

const mockEnv = vi.hoisted(() => ({
  ANTHROPIC_API_KEY: 'test-anthropic-key' as string | undefined,
}))

vi.mock('@/libs/Env', () => ({ Env: mockEnv }))

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

const validInput = {
  projectName: 'My Store',
  description: 'An online store selling handmade goods',
}

const anthropicResponse = (text: string) => ({
  ok: true,
  json: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text }],
  }),
})

describe('ProjectInferenceService', () => {
  let projectInferenceService: ProjectInferenceService

  beforeEach(() => {
    vi.clearAllMocks()
    mockEnv.ANTHROPIC_API_KEY = 'test-anthropic-key'
    projectInferenceService = new ProjectInferenceService()
  })

  describe('inferProjectDetails', () => {
    it('returns a parsed suggestion for a well-formed response', async () => {
      mockFetch.mockResolvedValue(
        anthropicResponse(
          JSON.stringify({
            projectType: ProjectType.ECommerce,
            features: [ProjectFeature.Auth, ProjectFeature.Email],
            title: 'Handmade Goods Store',
          })
        )
      )

      const result =
        await projectInferenceService.inferProjectDetails(validInput)

      expect(result).toEqual({
        projectType: ProjectType.ECommerce,
        features: [ProjectFeature.Auth, ProjectFeature.Email],
        title: 'Handmade Goods Store',
      })
    })

    it('defaults to an empty features array when omitted', async () => {
      mockFetch.mockResolvedValue(
        anthropicResponse(
          JSON.stringify({
            projectType: ProjectType.Website,
            title: 'Simple Website',
          })
        )
      )

      const result =
        await projectInferenceService.inferProjectDetails(validInput)

      expect(result.features).toEqual([])
    })

    it('POSTs to the Anthropic messages endpoint with the API key', async () => {
      mockFetch.mockResolvedValue(
        anthropicResponse(
          JSON.stringify({
            projectType: ProjectType.Website,
            features: [],
            title: 'Site',
          })
        )
      )

      await projectInferenceService.inferProjectDetails(validInput)

      const [url, options] = mockFetch.mock.calls[0]!

      expect(url).toBe('https://api.anthropic.com/v1/messages')
      expect(options.headers['x-api-key']).toBe('test-anthropic-key')
    })

    it('throws PROJECT_INFERENCE_NOT_CONFIGURED when the API key is missing', async () => {
      mockEnv.ANTHROPIC_API_KEY = undefined

      await expect(
        projectInferenceService.inferProjectDetails(validInput)
      ).rejects.toThrow(GraphQLError)

      try {
        await projectInferenceService.inferProjectDetails(validInput)

        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as GraphQLError).extensions.code).toBe(
          'PROJECT_INFERENCE_NOT_CONFIGURED'
        )
      }

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('throws PROJECT_INFERENCE_FAILED when the request fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('server error'),
      })

      try {
        await projectInferenceService.inferProjectDetails(validInput)

        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as GraphQLError).extensions.code).toBe(
          'PROJECT_INFERENCE_FAILED'
        )
      }
    })

    it('throws PROJECT_INFERENCE_FAILED when fetch rejects', async () => {
      mockFetch.mockRejectedValue(new Error('network down'))

      try {
        await projectInferenceService.inferProjectDetails(validInput)

        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as GraphQLError).extensions.code).toBe(
          'PROJECT_INFERENCE_FAILED'
        )
      }
    })

    it('degrades gracefully on an empty response instead of crashing', async () => {
      mockFetch.mockResolvedValue(anthropicResponse(''))

      try {
        await projectInferenceService.inferProjectDetails(validInput)

        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError)
        expect((error as GraphQLError).extensions.code).toBe(
          'PROJECT_INFERENCE_MALFORMED'
        )
      }
    })

    it('degrades gracefully on malformed (non-JSON) output instead of crashing', async () => {
      mockFetch.mockResolvedValue(
        anthropicResponse('Sure! Here is a suggestion: not json')
      )

      try {
        await projectInferenceService.inferProjectDetails(validInput)

        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError)
        expect((error as GraphQLError).extensions.code).toBe(
          'PROJECT_INFERENCE_MALFORMED'
        )
      }
    })

    it('degrades gracefully when the JSON is well-formed but fails validation', async () => {
      mockFetch.mockResolvedValue(
        anthropicResponse(
          JSON.stringify({
            projectType: 'not_a_real_type',
            features: [],
            title: 'X',
          })
        )
      )

      try {
        await projectInferenceService.inferProjectDetails(validInput)

        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError)
        expect((error as GraphQLError).extensions.code).toBe(
          'PROJECT_INFERENCE_MALFORMED'
        )
      }
    })

    it('logs and rethrows without leaking raw content on parse failure', async () => {
      const mockLoggerError = vi.mocked(logger.error)
      mockFetch.mockResolvedValue(anthropicResponse('not json'))

      await expect(
        projectInferenceService.inferProjectDetails(validInput)
      ).rejects.toThrow(GraphQLError)

      expect(mockLoggerError).toHaveBeenCalled()
    })
  })
})
