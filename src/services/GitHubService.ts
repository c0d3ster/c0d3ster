import { GraphQLError } from 'graphql'
import _sodium from 'libsodium-wrappers'

import { logger } from '@/libs/Logger'

const GITHUB_API = 'https://api.github.com'
const ORG = process.env.GITHUB_ORG ?? 'c0d3ster'
const TOKEN = process.env.GITHUB_TOKEN!
const TEMPLATE_REPO =
  process.env.GITHUB_TEMPLATE_REPO ?? 'nextjs-graphql-template'

async function encryptSecret(
  publicKeyB64: string,
  secretValue: string
): Promise<string> {
  await _sodium.ready
  const sodium = _sodium
  const keyBytes = sodium.from_base64(
    publicKeyB64,
    sodium.base64_variants.ORIGINAL
  )
  const messageBytes = sodium.from_string(secretValue)
  const encrypted = sodium.crypto_box_seal(messageBytes, keyBytes)
  return sodium.to_base64(encrypted, sodium.base64_variants.ORIGINAL)
}

export type GitHubRepo = {
  html_url: string
  name: string
  ssh_url: string
  clone_url: string
}

export async function createRepoFromTemplate(
  repoName: string,
  description?: string
): Promise<GitHubRepo> {
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

async function fetchRepoPublicKey(
  repoName: string,
  retries = 5,
  delayMs = 2000
): Promise<{ key: string; key_id: string }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(
      `${GITHUB_API}/repos/${ORG}/${repoName}/actions/secrets/public-key`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    )

    if (res.ok) {
      return res.json() as Promise<{ key: string; key_id: string }>
    }

    if (res.status === 404 && attempt < retries) {
      logger.info('Repo not ready yet, retrying...', { repoName, attempt })
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      continue
    }

    const body = await res.text()
    logger.error('Failed to fetch repo public key', { status: res.status, body })
    throw new GraphQLError(
      `Failed to fetch repo public key for secret encryption: ${body}`,
      { extensions: { code: 'GITHUB_SECRET_KEY_FETCH_FAILED' } }
    )
  }

  throw new GraphQLError('Repo did not become ready in time for secret setup', {
    extensions: { code: 'GITHUB_SECRET_KEY_FETCH_FAILED' },
  })
}

export async function addRepoSecret(
  repoName: string,
  secretName: string,
  secretValue: string
): Promise<void> {
  const { key, key_id } = await fetchRepoPublicKey(repoName)

  const encryptedValue = await encryptSecret(key, secretValue)

  const secretRes = await fetch(
    `${GITHUB_API}/repos/${ORG}/${repoName}/actions/secrets/${secretName}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        encrypted_value: encryptedValue,
        key_id,
      }),
    }
  )

  if (!secretRes.ok && secretRes.status !== 201 && secretRes.status !== 204) {
    const body = await secretRes.text()
    logger.error('Failed to add repo secret', {
      secretName,
      status: secretRes.status,
      body,
    })
    throw new GraphQLError(`Failed to add repo secret ${secretName}: ${body}`, {
      extensions: { code: 'GITHUB_SECRET_ADD_FAILED' },
    })
  }
}
