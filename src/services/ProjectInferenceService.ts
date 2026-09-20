import { GraphQLError } from 'graphql'
import { z } from 'zod'

import { ProjectFeature, ProjectType } from '@/graphql/schema'
import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'

const ANTHROPIC_MESSAGES_API = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_API_VERSION = '2023-06-01'
const MODEL = 'claude-haiku-4-5-20251001'

// Narrow, swappable contract: description + name in, classification out.
// Keeping this shape (and no dependency on request/project persistence types)
// is what lets this service move into a shared categorization package later.
type ProjectInferenceInput = {
  projectName: string
  description: string
}

type ProjectInferenceResult = {
  projectType: ProjectType
  features: ProjectFeature[]
  title: string
}

const inferenceResponseSchema = z.object({
  projectType: z.nativeEnum(ProjectType),
  features: z.array(z.nativeEnum(ProjectFeature)).default([]),
  title: z.string().trim().min(1).max(255),
})

const buildPrompt = (input: ProjectInferenceInput): string => {
  const projectTypes = Object.values(ProjectType)
  const features = Object.values(ProjectFeature)

  return `A prospective client submitted this project request:

Project name: ${input.projectName}
Description: ${input.description}

Classify this request. Respond with ONLY a JSON object (no prose, no markdown fences, no code blocks) matching exactly this shape:
{"projectType": one of [${projectTypes.map((type) => `"${type}"`).join(', ')}], "features": an array of zero or more of [${features.map((feature) => `"${feature}"`).join(', ')}], "title": a short, human-readable project title (max 60 characters)}`
}

export class ProjectInferenceService {
  async inferProjectDetails(
    input: ProjectInferenceInput
  ): Promise<ProjectInferenceResult> {
    const apiKey = Env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new GraphQLError(
        'Project inference is not configured on this server',
        { extensions: { code: 'PROJECT_INFERENCE_NOT_CONFIGURED' } }
      )
    }

    const raw = await this.requestSuggestion(apiKey, input)
    return this.parseSuggestion(raw)
  }

  private async requestSuggestion(
    apiKey: string,
    input: ProjectInferenceInput
  ): Promise<string> {
    try {
      const res = await fetch(ANTHROPIC_MESSAGES_API, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_API_VERSION,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 400,
          messages: [{ role: 'user', content: buildPrompt(input) }],
        }),
      })

      if (!res.ok) {
        const body = await res.text()
        logger.error('Project inference request failed', {
          status: res.status,
          body,
        })
        throw new GraphQLError('Failed to generate project suggestions', {
          extensions: { code: 'PROJECT_INFERENCE_FAILED' },
        })
      }

      const data = (await res.json()) as {
        content?: { type: string; text?: string }[]
      }

      return data.content?.find((block) => block.type === 'text')?.text ?? ''
    } catch (error) {
      if (error instanceof GraphQLError) throw error

      logger.error('Project inference request errored', {
        error: String(error),
      })
      throw new GraphQLError('Failed to generate project suggestions', {
        extensions: { code: 'PROJECT_INFERENCE_FAILED' },
      })
    }
  }

  private parseSuggestion(raw: string): ProjectInferenceResult {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (error) {
      logger.error('Project inference returned malformed JSON', {
        raw,
        error: String(error),
      })
      throw new GraphQLError(
        'Received an unreadable suggestion from the inference model',
        { extensions: { code: 'PROJECT_INFERENCE_MALFORMED' } }
      )
    }

    const result = inferenceResponseSchema.safeParse(parsed)
    if (!result.success) {
      logger.error('Project inference response failed validation', {
        raw,
        issues: result.error.issues,
      })
      throw new GraphQLError(
        'Received an invalid suggestion from the inference model',
        { extensions: { code: 'PROJECT_INFERENCE_MALFORMED' } }
      )
    }

    return result.data
  }
}
