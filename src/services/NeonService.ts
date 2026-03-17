import { GraphQLError } from 'graphql'

import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'

const NEON_API = 'https://console.neon.tech/api/v2'

export async function createNeonProject(
  name: string
): Promise<{ neonProjectId: string; databaseUrl: string }> {
  const API_KEY = Env.NEON_API_KEY

  if (!API_KEY) {
    throw new GraphQLError('Neon provisioning is not configured on this server', {
      extensions: { code: 'NEON_NOT_CONFIGURED' },
    })
  }

  const res = await fetch(`${NEON_API}/projects`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ project: { name } }),
  })

  if (!res.ok) {
    const body = await res.text()
    logger.error('Neon project creation failed', { status: res.status, body })
    throw new GraphQLError(`Neon project creation failed: ${body}`, {
      extensions: { code: 'NEON_PROJECT_CREATION_FAILED' },
    })
  }

  const data = (await res.json()) as {
    project: { id: string }
    connection_uris: { connection_uri: string }[]
  }

  const neonProjectId = data.project.id
  const databaseUrl = data.connection_uris[0]?.connection_uri

  if (!databaseUrl) {
    throw new GraphQLError('Neon project created but no connection URI returned', {
      extensions: { code: 'NEON_PROJECT_CREATION_FAILED' },
    })
  }

  logger.info('Neon project created', { name, neonProjectId })

  return { neonProjectId, databaseUrl }
}

export async function deleteNeonProject(neonProjectId: string): Promise<void> {
  const API_KEY = Env.NEON_API_KEY

  if (!API_KEY) {
    return
  }

  const res = await fetch(`${NEON_API}/projects/${neonProjectId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  })

  if (!res.ok && res.status !== 404) {
    const body = await res.text()
    logger.error('Neon project deletion failed', {
      neonProjectId,
      status: res.status,
      body,
    })
    return
  }

  logger.info('Neon project deleted', { neonProjectId })
}
