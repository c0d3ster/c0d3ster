import { GraphQLError } from 'graphql'

import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'

const VERCEL_API = 'https://api.vercel.com'
const TOKEN = Env.VERCEL_TOKEN
const ORG = Env.GITHUB_ORG ?? 'c0d3ster'

export async function createVercelProject(repoName: string): Promise<string> {
  if (!TOKEN) {
    throw new GraphQLError(
      'Vercel provisioning is not configured on this server',
      {
        extensions: { code: 'VERCEL_NOT_CONFIGURED' },
      }
    )
  }

  const res = await fetch(`${VERCEL_API}/v10/projects`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: repoName,
      framework: 'nextjs',
      gitRepository: {
        type: 'github',
        repo: `${ORG}/${repoName}`,
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    logger.error('Vercel project creation failed', { status: res.status, body })
    throw new GraphQLError(`Vercel project creation failed: ${body}`, {
      extensions: { code: 'VERCEL_PROJECT_CREATION_FAILED' },
    })
  }

  const data = (await res.json()) as { name: string }
  const stagingUrl = `https://${data.name}.vercel.app`

  logger.info('Vercel project created', { repoName, stagingUrl })

  return stagingUrl
}
