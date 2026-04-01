import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const Env = createEnv({
  server: {
    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_WEBHOOK_SECRET: z.string().optional(),
    DATABASE_URL: z.string().min(1),
    BETTER_STACK_SOURCE_TOKEN: z.string().optional(),
    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    GITHUB_TOKEN: z.string().min(1).optional(),
    GITHUB_ORG: z.string().min(1).default('c0d3ster'),
    GITHUB_TEMPLATE_REPO: z.string().min(1).default('nextjs-graphql-template'),
    APP_ENV: z.string().default('dev').transform((s) => s.toLowerCase()),
    VERCEL_TOKEN: z.string().min(1).optional(),
    NEON_API_KEY: z.string().min(1).optional(),
    NEON_ORG_ID: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  // You need to destructure all the keys manually
  runtimeEnv: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_STACK_SOURCE_TOKEN: process.env.BETTER_STACK_SOURCE_TOKEN,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_ORG: process.env.GITHUB_ORG,
    GITHUB_TEMPLATE_REPO: process.env.GITHUB_TEMPLATE_REPO,
    APP_ENV: process.env.APP_ENV,
    VERCEL_TOKEN: process.env.VERCEL_TOKEN,
    NEON_API_KEY: process.env.NEON_API_KEY,
    NEON_ORG_ID: process.env.NEON_ORG_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },
})
