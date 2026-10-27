import { GraphQLError } from 'graphql'
import sodium from 'libsodium-wrappers'

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

// Workflow in the template repo that runs `pnpm bootstrap` and pushes the result to main
const BOOTSTRAP_WORKFLOW = 'bootstrap.yml'
// Secret the workflow pushes with: GITHUB_TOKEN cannot change files under .github/workflows
const BOOTSTRAP_SECRET = 'BOOTSTRAP_TOKEN'
// A repo generated from a template takes a moment before its secrets and workflows are reachable
const RETRY_ATTEMPTS = 6
const RETRY_MS = 5_000

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

const githubHeaders = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
})

const failBootstrap = async (
  res: Response,
  message: string
): Promise<never> => {
  const body = await res.text()
  logger.error(message, { status: res.status, body })
  throw new GraphQLError(`${message}: ${body}`, {
    extensions: { code: 'GITHUB_BOOTSTRAP_FAILED' },
  })
}

// Retries while GitHub answers 404 for a repo that has not finished generating
const fetchWhenReady = async (
  url: string,
  init: RequestInit,
  failure: string
): Promise<Response> => {
  for (let attempt = 1; attempt < RETRY_ATTEMPTS; attempt++) {
    const res = await fetch(url, init)
    if (res.ok) return res
    if (res.status !== 404) return failBootstrap(res, failure)
    await sleep(RETRY_MS)
  }

  const res = await fetch(url, init)
  return res.ok ? res : failBootstrap(res, failure)
}

const encryptSecret = async (
  value: string,
  publicKey: string
): Promise<string> => {
  await sodium.ready
  const key = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL)
  const sealed = sodium.crypto_box_seal(value, key)
  return sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL)
}

/**
 * Starts the template's bootstrap workflow so the new repo keeps only the
 * selected features, and returns without waiting for it to finish. The
 * workflow opens a pull request with the pruned code, so the repo starts
 * with a reviewable record of what was removed.
 * Feature ids the template does not know are ignored by its bootstrap script.
 */
export const bootstrapRepo = async (
  repoName: string,
  features: string[]
): Promise<void> => {
  const TOKEN = Env.GITHUB_TOKEN
  const ORG = Env.GITHUB_ORG

  if (!TOKEN || !ORG) {
    throw new GraphQLError(
      'GitHub provisioning is not configured on this server',
      { extensions: { code: 'GITHUB_NOT_CONFIGURED' } }
    )
  }

  const repoUrl = `${GITHUB_API}/repos/${ORG}/${repoName}`
  const headers = githubHeaders(TOKEN)

  const keyRes = await fetchWhenReady(
    `${repoUrl}/actions/secrets/public-key`,
    { headers },
    'GitHub bootstrap secret key lookup failed'
  )
  const { key_id: keyId, key } = (await keyRes.json()) as {
    key_id: string
    key: string
  }

  await fetchWhenReady(
    `${repoUrl}/actions/secrets/${BOOTSTRAP_SECRET}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        encrypted_value: await encryptSecret(TOKEN, key),
        key_id: keyId,
      }),
    },
    'GitHub bootstrap secret creation failed'
  )

  await fetchWhenReady(
    `${repoUrl}/actions/workflows/${BOOTSTRAP_WORKFLOW}/dispatches`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: 'main',
        inputs: { features: features.join(',') },
      }),
    },
    'GitHub bootstrap dispatch failed'
  )

  logger.info('GitHub bootstrap started', { repoName, features })
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
