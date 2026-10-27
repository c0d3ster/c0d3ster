import { GraphQLError } from 'graphql'
import sodium from 'libsodium-wrappers'
import { Buffer } from 'node:buffer'
import { createSign } from 'node:crypto'

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
// Secret the workflow pushes and opens its PR with: GITHUB_TOKEN cannot change files under
// .github/workflows, and the server's own PAT is too powerful to leave in a client repo
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

const base64Url = (value: string | Buffer): string =>
  Buffer.from(value).toString('base64url')

// Short-lived JWT that authenticates as the GitHub App itself
const createAppJwt = (appId: string, privateKey: string): string => {
  const now = Math.floor(Date.now() / 1000)
  const unsigned = [
    base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' })),
    // iat is backdated to allow for clock drift, 10 minutes is GitHub's maximum lifetime
    base64Url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId })),
  ].join('.')
  const signature = createSign('RSA-SHA256').update(unsigned).sign(privateKey)

  return `${unsigned}.${base64Url(signature)}`
}

/**
 * Mints an installation token that can only touch the new repo, for an hour,
 * with just the permissions the bootstrap workflow needs. Leaving it behind
 * as a repo secret is harmless once it expires, unlike the server's own PAT.
 */
const createBootstrapToken = async (repoName: string): Promise<string> => {
  const APP_ID = Env.GITHUB_APP_ID
  const PRIVATE_KEY = Env.GITHUB_APP_PRIVATE_KEY
  const ORG = Env.GITHUB_ORG

  if (!APP_ID || !PRIVATE_KEY) {
    throw new GraphQLError(
      'GitHub App bootstrap is not configured on this server',
      { extensions: { code: 'GITHUB_NOT_CONFIGURED' } }
    )
  }

  // Env files often hold the PEM on one line with escaped newlines
  const headers = githubHeaders(
    createAppJwt(APP_ID, PRIVATE_KEY.replace(/\\n/g, '\n'))
  )

  const installationRes = await fetchWhenReady(
    `${GITHUB_API}/repos/${ORG}/${repoName}/installation`,
    { headers },
    'GitHub App installation lookup failed'
  )
  const { id } = (await installationRes.json()) as { id: number }

  const tokenRes = await fetchWhenReady(
    `${GITHUB_API}/app/installations/${id}/access_tokens`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        repositories: [repoName],
        permissions: {
          contents: 'write',
          pull_requests: 'write',
          workflows: 'write',
        },
      }),
    },
    'GitHub App token creation failed'
  )
  const { token } = (await tokenRes.json()) as { token: string }

  return token
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

  // Minted first so a missing App config fails before the secret is touched
  const bootstrapToken = await createBootstrapToken(repoName)

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
        encrypted_value: await encryptSecret(bootstrapToken, key),
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
