import { GraphQLError } from 'graphql'

import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'

const GITHUB_API = 'https://api.github.com'

type GitHubRepo = {
  html_url: string
  name: string
  ssh_url: string
  clone_url: string
}

export async function createRepoFromTemplate(
  repoName: string,
  description?: string
): Promise<GitHubRepo> {
  const TOKEN = Env.GITHUB_TOKEN
  const ORG = Env.GITHUB_ORG
  const TEMPLATE_REPO = Env.GITHUB_TEMPLATE_REPO

  if (!TOKEN || !ORG || !TEMPLATE_REPO) {
    throw new GraphQLError(
      'GitHub provisioning is not configured on this server',
      { extensions: { code: 'GITHUB_NOT_CONFIGURED' } }
    )
  }

  const res = await fetch(
    `${GITHUB_API}/repos/${ORG}/${TEMPLATE_REPO}/generate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        owner: ORG,
        name: repoName,
        private: true,
        description: description ?? `Auto-provisioned repo for ${repoName}`,
        include_all_branches: false,
      }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    logger.error('GitHub repo creation failed', { status: res.status, body })
    throw new GraphQLError(`GitHub repo creation failed: ${body}`, {
      extensions: { code: 'GITHUB_REPO_CREATION_FAILED' },
    })
  }

  return res.json() as Promise<GitHubRepo>
}

export async function deleteRepo(repoName: string): Promise<void> {
  const TOKEN = Env.GITHUB_TOKEN
  const ORG = Env.GITHUB_ORG

  if (!TOKEN || !ORG) {
    throw new GraphQLError(
      'GitHub provisioning is not configured on this server',
      { extensions: { code: 'GITHUB_NOT_CONFIGURED' } }
    )
  }

  const res = await fetch(`${GITHUB_API}/repos/${ORG}/${repoName}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!res.ok && res.status !== 404) {
    const body = await res.text()
    logger.error('GitHub repo deletion failed', {
      repoName,
      status: res.status,
      body,
    })
    throw new GraphQLError(`GitHub repo deletion failed: ${body}`, {
      extensions: { code: 'GITHUB_REPO_DELETION_FAILED' },
    })
  }

  logger.info('GitHub repo deleted', { repoName })
}
