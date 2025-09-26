import 'reflect-metadata'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Buffer } from 'node:buffer'
import React from 'react'
import { afterEach, beforeEach, vi } from 'vitest'

// Set Buffer for browser environment with full polyfill
// eslint-disable-next-line node/prefer-global/buffer
if (typeof globalThis.Buffer === 'undefined') {
  // eslint-disable-next-line node/prefer-global/buffer
  globalThis.Buffer = Buffer
}

// Mock process if it doesn't exist (for Node.js compatibility)
if (typeof process === 'undefined') {
  globalThis.process = {
    env: {},
    cwd: () => '',
    platform: 'browser',
  } as any
}

// Mock __dirname for browser environment
if (typeof __dirname === 'undefined') {
  globalThis.__dirname = '/'
}

// Mock Clerk to prevent server-side imports
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: null,
    isLoaded: true,
    isSignedIn: false,
  }),

  useAuth: () => ({
    userId: null,
    isLoaded: true,
    isSignedIn: false,
  }),
  auth: () => Promise.resolve({ userId: null }),
}))

// Mock Clerk server
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => Promise.resolve({ userId: null }),
  currentUser: () => Promise.resolve(null),
  clerkClient: {
    users: {
      getUser: () => Promise.resolve(null),
    },
  },
}))

// Mock Toast utility
vi.mock('@/libs/Toast', () => ({
  Toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock Logger utility
vi.mock('@/libs/Logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock next/image globally for all tests
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <div data-testid='next-image' data-src={src} data-alt={alt} {...props} />
  ),
}))

vi.mock('@/libs/Env', () => ({
  Env: {
    DATABASE_URL: 'test-database-url',
  },
}))

// Mock pg module to prevent database imports
vi.mock('pg', () => ({
  Client: vi.fn(),
  Pool: vi.fn(),
}))

// Mock drizzle-orm to prevent database imports
vi.mock('drizzle-orm', () => ({
  drizzle: vi.fn(),
  pgTable: vi.fn(),
  text: vi.fn(),
  integer: vi.fn(),
  timestamp: vi.fn(),
  boolean: vi.fn(),
  json: vi.fn(),
  eq: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  desc: vi.fn(),
  asc: vi.fn(),
  isNull: vi.fn(),
  ne: vi.fn(),
  exists: vi.fn(),
  pgEnum: vi.fn(),
  sql: vi.fn(),
  SQL: vi.fn(),
}))

// Mock any other database-related modules
vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: vi.fn(),
  pgTable: vi.fn(),
  text: vi.fn(),
  integer: vi.fn(),
  timestamp: vi.fn(),
  boolean: vi.fn(),
  json: vi.fn(),
  eq: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  desc: vi.fn(),
  isNull: vi.fn(),
  ne: vi.fn(),
  pgEnum: vi.fn(),
  sql: vi.fn(),
  NodePgDatabase: vi.fn(),
}))

// Mock the specific module that's causing the pg import
vi.mock('@/libs/DB', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      projects: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      projectRequests: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      statusUpdates: {
        findMany: vi.fn(),
      },
      projectCollaborators: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      projectFiles: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
    transaction: vi.fn(),
    execute: vi.fn(),
  },
}))

// Mock IntersectionObserver
globalThis.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn((_element) => {
    // Immediately trigger the callback to simulate element being in viewport
    setTimeout(() => {
      callback([{ isIntersecting: true }])
    }, 0)
  }),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Clear all mocks and timers before each test
beforeEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
})

// Cleanup after each test (only in browser environment)
afterEach(() => {
  if (typeof window !== 'undefined') {
    cleanup()
  }
})
