import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { UserRole } from '@/graphql/generated/graphql'

import { CompactUserProfile } from './CompactUserProfile'

// Mock Clerk hooks
const mockUser = vi.fn()
vi.mock('@clerk/nextjs', async () => {
  const actual = await vi.importActual('@clerk/nextjs')
  return {
    ...actual,
    useUser: () => mockUser(),
  }
})

// Mock API client
const mockGetMe = vi.fn()
vi.mock('@/apiClients/userApiClient', async () => {
  const actual = await vi.importActual('@/apiClients/userApiClient')
  return {
    ...actual,
    useGetMe: () => mockGetMe(),
  }
})

// Mock utils
vi.mock('@/utils', () => ({
  isAdminRole: (role: string) => role === UserRole.Admin,
}))

describe('CompactUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state when user is not loaded', () => {
    mockUser.mockReturnValue({
      user: null,
      isLoaded: false,
    })
    mockGetMe.mockReturnValue({
      data: null,
      loading: true,
    })

    render(<CompactUserProfile />)

    // Check for loading skeleton by looking for the animate-pulse class
    const loadingElements = screen.getAllByRole('generic')
    const loadingElement = loadingElements.find((el) =>
      el.classList.contains('animate-pulse')
    )

    expect(loadingElement).toBeInTheDocument()
  })

  it('renders loading state when user data is loading', () => {
    mockUser.mockReturnValue({
      user: { id: '1' },
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: null,
      loading: true,
    })

    render(<CompactUserProfile />)

    // Check for loading skeleton by looking for the animate-pulse class
    const loadingElements = screen.getAllByRole('generic')
    const loadingElement = loadingElements.find((el) =>
      el.classList.contains('animate-pulse')
    )

    expect(loadingElement).toBeInTheDocument()
  })

  it('renders user profile with admin badge', () => {
    const mockUserData = {
      id: '1',
      imageUrl: 'https://example.com/avatar.jpg',
      emailAddresses: [{ emailAddress: 'admin@example.com' }],
    }

    mockUser.mockReturnValue({
      user: mockUserData,
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: {
        me: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.Admin,
        },
      },
      loading: false,
    })

    render(<CompactUserProfile />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })

  it('renders user profile with developer badge', () => {
    const mockUserData = {
      id: '1',
      imageUrl: 'https://example.com/avatar.jpg',
      emailAddresses: [{ emailAddress: 'dev@example.com' }],
    }

    mockUser.mockReturnValue({
      user: mockUserData,
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: {
        me: {
          id: '1',
          firstName: 'Jane',
          lastName: 'Smith',
          role: UserRole.Developer,
        },
      },
      loading: false,
    })

    render(<CompactUserProfile />)

    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('dev@example.com')).toBeInTheDocument()
    expect(screen.getByText('DEV')).toBeInTheDocument()
  })

  it('renders user profile with client badge', () => {
    const mockUserData = {
      id: '1',
      imageUrl: 'https://example.com/avatar.jpg',
      emailAddresses: [{ emailAddress: 'client@example.com' }],
    }

    mockUser.mockReturnValue({
      user: mockUserData,
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: {
        me: {
          id: '1',
          firstName: 'Bob',
          lastName: 'Client',
          role: UserRole.Client,
        },
      },
      loading: false,
    })

    render(<CompactUserProfile />)

    expect(screen.getByText('Bob Client')).toBeInTheDocument()
    expect(screen.getByText('client@example.com')).toBeInTheDocument()
    expect(screen.getByText('CLIENT')).toBeInTheDocument()
  })

  it('renders user profile with image when available', () => {
    const mockUserData = {
      id: '1',
      imageUrl: 'https://example.com/avatar.jpg',
      emailAddresses: [{ emailAddress: 'user@example.com' }],
    }

    mockUser.mockReturnValue({
      user: mockUserData,
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: {
        me: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.Client,
        },
      },
      loading: false,
    })

    render(<CompactUserProfile />)

    const avatar = screen.getByTestId('next-image')

    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('data-src', 'https://example.com/avatar.jpg')
  })

  it('renders fallback avatar when no image is available', () => {
    const mockUserData = {
      id: '1',
      imageUrl: null,
      emailAddresses: [{ emailAddress: 'user@example.com' }],
    }

    mockUser.mockReturnValue({
      user: mockUserData,
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: {
        me: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.Client,
        },
      },
      loading: false,
    })

    render(<CompactUserProfile />)

    expect(screen.getByText('J')).toBeInTheDocument() // First letter of name
  })

  it('uses email as display name when name is not available', () => {
    const mockUserData = {
      id: '1',
      imageUrl: null,
      emailAddresses: [{ emailAddress: 'user@example.com' }],
    }

    mockUser.mockReturnValue({
      user: mockUserData,
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: {
        me: {
          id: '1',
          firstName: null,
          lastName: null,
          role: UserRole.Client,
        },
      },
      loading: false,
    })

    render(<CompactUserProfile />)

    // Check for the display name in the heading
    expect(
      screen.getByRole('heading', { name: 'user@example.com' })
    ).toBeInTheDocument()
  })

  it('uses clerk user data when GraphQL data is not available', () => {
    const mockUserData = {
      id: '1',
      imageUrl: null,
      fullName: 'Clerk User',
      emailAddresses: [{ emailAddress: 'clerk@example.com' }],
    }

    mockUser.mockReturnValue({
      user: mockUserData,
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: null,
      loading: false,
    })

    render(<CompactUserProfile />)

    expect(screen.getByText('Clerk User')).toBeInTheDocument()
    expect(screen.getByText('clerk@example.com')).toBeInTheDocument()
  })
})
