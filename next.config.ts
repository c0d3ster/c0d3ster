import type { NextConfig } from 'next'

import withBundleAnalyzer from '@next/bundle-analyzer'

import './src/libs/Env'

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
      {
        protocol: 'https',
        hostname:
          'dev.0be4137bad787f8300dd055aa30d7454.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
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
