import type { NextConfig } from 'next'

import withBundleAnalyzer from '@next/bundle-analyzer'

import './src/libs/Env'

// R2 configuration constants
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
const R2_PUBLIC_HOST =
  R2_ACCOUNT_ID && R2_BUCKET_NAME
    ? `${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : null

// Define the base Next.js configuration
const baseConfig: NextConfig = {
  eslint: {
    dirs: ['.'],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        port: '',
        pathname: '/**',
      },
      // Add R2 public host if R2 is configured
      ...(R2_PUBLIC_HOST
        ? [
            {
              protocol: 'https' as const,
              hostname: R2_PUBLIC_HOST,
              port: '',
              pathname: '/**',
            },
          ]
        : []),
    ],
  },
}

// Conditionally enable bundle analysis
let configWithPlugins = baseConfig
if (process.env.ANALYZE === 'true') {
  configWithPlugins = withBundleAnalyzer()(baseConfig)
}

const nextConfig = configWithPlugins
export default nextConfig
