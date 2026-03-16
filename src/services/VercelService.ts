import { GraphQLError } from 'graphql'

import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'

const VERCEL_API = 'https://api.vercel.com'

export async function createVercelProject(repoName: string): Promise<string> {
  const TOKEN = Env.VERCEL_TOKEN
  const ORG = Env.GITHUB_ORG ?? 'c0d3ster'

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

  await triggerDeployment(TOKEN, ORG, data.name, repoName)

  return stagingUrl
}

async function triggerDeployment(
  token: string,
  org: string,
  projectName: string,
  repoName: string
): Promise<void> {
  const res = await fetch(`${VERCEL_API}/v13/deployments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName,
      gitSource: {
        type: 'github',
        org,
        repo: repoName,
        ref: 'main',
      },
      target: 'production',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    logger.error('Vercel deployment trigger failed', { status: res.status, body })
    throw new GraphQLError(`Vercel deployment trigger failed: ${body}`, {
      extensions: { code: 'VERCEL_DEPLOYMENT_FAILED' },
    })
  }

  logger.info('Vercel deployment triggered', { projectName, repoName })
}

export async function deleteVercelProject(projectName: string): Promise<void> {
  const TOKEN = Env.VERCEL_TOKEN

  if (!TOKEN) {
    return
  }

  const res = await fetch(`${VERCEL_API}/v9/projects/${projectName}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  })

  if (!res.ok && res.status !== 404) {
    const body = await res.text()
    logger.error('Vercel project deletion failed', {
      projectName,
      status: res.status,
      body,
    })
    return
  }

  logger.info('Vercel project deleted', { projectName })
}
