import { GraphQLError } from 'graphql'
import { z } from 'zod'

import { ProjectFeature, ProjectType } from '@/graphql/schema'
import { Env } from '@/libs/Env'
import { getFeatureLabel } from '@/libs/featureLabels'
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

// Features are read as plain strings and filtered afterwards, so one invented
// feature name doesn't throw away an otherwise good suggestion
const inferenceResponseSchema = z.object({
  projectType: z.nativeEnum(ProjectType),
  features: z.array(z.string()).default([]),
  title: z.string().trim().min(1).max(255),
})

const validFeatures = new Set<string>(Object.values(ProjectFeature))

const isProjectFeature = (value: string): value is ProjectFeature =>
  validFeatures.has(value)

const PROJECT_TYPE_DESCRIPTIONS: Record<ProjectType, string> = {
  [ProjectType.Website]:
    'A landing page or informational site describing a business. No logins or user accounts.',
  [ProjectType.WebApp]:
    'A fully functional application where users create accounts and interact with data: dashboards, member portals, booking tools.',
  [ProjectType.ECommerce]:
    'An online store where customers browse products, create accounts, and check out.',
  [ProjectType.MobileApp]:
    'A native or cross-platform iOS/Android app, typically with accounts and data that syncs across devices.',
  [ProjectType.Api]:
    'A backend-only service that other apps call into. No user-facing screens.',
  [ProjectType.Maintenance]:
    'Ongoing upkeep on something already built (by anyone): bug fixes, updates, and support, not a new build.',
  [ProjectType.Consultation]:
    'A paid advisory engagement (architecture review, audit, planning, scoping) with no build deliverable.',
  [ProjectType.Other]:
    'Does not fit the other types, for example hardware or firmware work.',
}

// Extra selection guidance where a feature's client-facing description is not enough
// for the model to recognize it. Kept here so the client-facing copy stays untouched.
const FEATURE_GUIDANCE: Partial<Record<ProjectFeature, string>> = {
  [ProjectFeature.CustomApi]:
    'Pick this whenever the deliverable is endpoints that other developers or systems call (always the case for project type "api"), and also when the project receives, exposes, or forwards data to other systems or services even if the request never says "API" (webhook receivers, integrations, data syncing, routing events between services). Do not pick it for the internal backend of a web app.',
  [ProjectFeature.ResponsiveDesign]:
    'Applies to websites and web apps only. Never pick it for a native mobile app or a backend-only service.',
  [ProjectFeature.PaymentProcessing]:
    'Pick this only when the project actually charges or collects money (checkout, subscriptions, invoices, deposits). Do not pick it when the project merely calculates, splits, or displays amounts.',
}

const buildPrompt = (input: ProjectInferenceInput): string => {
  const projectTypes = Object.values(ProjectType)
  const features = Object.values(ProjectFeature)
  const typeLines = projectTypes
    .map((type) => `- "${type}": ${PROJECT_TYPE_DESCRIPTIONS[type]}`)
    .join('\n')
  const featureLines = features
    .map((feature) => {
      const { label, description } = getFeatureLabel(feature)
      return `- "${feature}" (${label}): ${description}`
    })
    .join('\n')

  const guidanceLines = Object.entries(FEATURE_GUIDANCE)
    .map(([feature, note]) => `- "${feature}": ${note}`)
    .join('\n')

  return `A prospective client submitted this project request:

Project name: ${input.projectName}
Description: ${input.description}

Project types:
${typeLines}

Features:
${featureLines}

Selection notes:
${guidanceLines}

Classify this request. Pick the single best project type. Select a feature only if the description asks for it or clearly implies it; do not pad the list, and return an empty array when nothing is clearly called for (an empty array is a perfectly good answer for a simple project). Respect explicit exclusions: if the client says they do not want something, such as accounts or saved data, do not pick the features that provide it. Use only the exact feature values listed above.

Respond with ONLY a JSON object (no prose, no markdown fences, no code blocks) matching exactly this shape:
{"projectType": one of [${projectTypes.map((type) => `"${type}"`).join(', ')}], "features": an array of zero or more of [${features.map((feature) => `"${feature}"`).join(', ')}], "title": a short, human-readable project title (max 60 characters)}`
}

// Haiku occasionally wraps JSON in a markdown fence despite the prompt saying not to
const stripCodeFences = (raw: string): string =>
  raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

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
          temperature: 0,
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
      parsed = JSON.parse(stripCodeFences(raw))
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

    const features = [...new Set(result.data.features)].filter(isProjectFeature)
    const dropped = result.data.features.filter(
      (feature) => !isProjectFeature(feature)
    )
    if (dropped.length > 0) {
      logger.warn('Project inference suggested unknown features, dropping', {
        dropped,
      })
    }

    return { ...result.data, features }
  }
}
