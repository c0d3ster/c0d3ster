import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { UserRole } from '@/graphql/generated/graphql'

import { UserProfile } from './UserProfile'

// Mock Clerk hooks
const mockUser = vi.fn()
vi.mock('@clerk/nextjs', async () => {
  const actual = await vi.importActual('@clerk/nextjs')
  return {
    ...actual,
    useUser: () => mockUser(),
  }
})

// Mock API clients
const mockGetMe = vi.fn()
const mockUpdateUser = vi.fn()

vi.mock('@/apiClients', async () => {
  const actual = await vi.importActual('@/apiClients')
  return {
    ...actual,
    useGetMe: () => mockGetMe(),
    useUpdateUser: () => mockUpdateUser(),
  }
})

// Mock utils
vi.mock('@/utils', () => ({
  formatProfileDate: (date: string) => new Date(date).toLocaleDateString(),
}))

describe('UserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default mock behavior
    mockUpdateUser.mockReturnValue([
      vi.fn().mockResolvedValue({ data: { updateUser: { id: '1' } } }),
      { loading: false, error: null },
    ])
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

    render(<UserProfile />)

    expect(screen.getByText('LOADING...')).toBeInTheDocument()
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

    render(<UserProfile />)

    expect(screen.getByText('LOADING...')).toBeInTheDocument()
  })

  it('renders sign in message when user is not authenticated', () => {
    mockUser.mockReturnValue({
      user: null,
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: { me: { id: '1', firstName: 'John', lastName: 'Doe' } },
      loading: false,
    })

    render(<UserProfile />)

    expect(
      screen.getByText('Please sign in to view your profile.')
    ).toBeInTheDocument()
  })

  it('renders user profile with complete information', () => {
    const mockClerkUser = {
      id: '1',
      imageUrl: 'https://example.com/avatar.jpg',
      primaryEmailAddress: { emailAddress: 'user@example.com' },
    }

    mockUser.mockReturnValue({
      user: mockClerkUser,
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: {
        me: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          role: UserRole.Client,
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
      loading: false,
    })

    render(<UserProfile />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('Doe')).toBeInTheDocument()
    expect(screen.getByText('EDIT PROFILE')).toBeInTheDocument()
  })

  it('renders profile image when available', () => {
    const mockClerkUser = {
      id: '1',
      imageUrl: 'https://example.com/avatar.jpg',
      primaryEmailAddress: { emailAddress: 'user@example.com' },
    }

    mockUser.mockReturnValue({
      user: mockClerkUser,
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: {
        me: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          role: UserRole.Client,
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
      loading: false,
    })

    render(<UserProfile />)

    const profileImage = screen.getByTestId('next-image')

    expect(profileImage).toBeInTheDocument()
    expect(profileImage).toHaveAttribute(
      'data-src',
      'https://example.com/avatar.jpg'
    )
  })

  it('enters edit mode when edit button is clicked', () => {
    const mockClerkUser = {
      id: '1',
      imageUrl: null,
      primaryEmailAddress: { emailAddress: 'user@example.com' },
    }

    mockUser.mockReturnValue({
      user: mockClerkUser,
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: {
        me: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          role: UserRole.Client,
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
      loading: false,
    })

    render(<UserProfile />)

    const editButton = screen.getByText('EDIT PROFILE')
    fireEvent.click(editButton)

    expect(screen.getByLabelText('FIRST NAME')).toBeInTheDocument()
    expect(screen.getByLabelText('LAST NAME')).toBeInTheDocument()
    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
    expect(screen.getByText('SAVE CHANGES')).toBeInTheDocument()
    expect(screen.getByText('CANCEL')).toBeInTheDocument()
  })

  it('updates form data when editing', () => {
    const mockClerkUser = {
      id: '1',
      imageUrl: null,
      primaryEmailAddress: { emailAddress: 'user@example.com' },
    }

    mockUser.mockReturnValue({
      user: mockClerkUser,
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: {
        me: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          role: UserRole.Client,
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
      loading: false,
    })

    render(<UserProfile />)

    const editButton = screen.getByText('EDIT PROFILE')
    fireEvent.click(editButton)

    const firstNameInput = screen.getByLabelText('FIRST NAME')
    const lastNameInput = screen.getByLabelText('LAST NAME')

    fireEvent.change(firstNameInput, { target: { value: 'Jane' } })
    fireEvent.change(lastNameInput, { target: { value: 'Smith' } })

    expect(firstNameInput).toHaveValue('Jane')
    expect(lastNameInput).toHaveValue('Smith')
  })

  it('cancels edit mode when cancel button is clicked', () => {
    const mockClerkUser = {
      id: '1',
      imageUrl: null,
      primaryEmailAddress: { emailAddress: 'user@example.com' },
    }

    mockUser.mockReturnValue({
      user: mockClerkUser,
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: {
        me: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          role: UserRole.Client,
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
      loading: false,
    })

    render(<UserProfile />)

    const editButton = screen.getByText('EDIT PROFILE')
    fireEvent.click(editButton)

    expect(screen.getByLabelText('FIRST NAME')).toBeInTheDocument()

    const cancelButton = screen.getByText('CANCEL')
    fireEvent.click(cancelButton)

    expect(screen.queryByLabelText('FIRST NAME')).not.toBeInTheDocument()
    expect(screen.getByText('EDIT PROFILE')).toBeInTheDocument()
  })

  it('submits form and calls update user mutation', async () => {
    const mockClerkUser = {
      id: '1',
      imageUrl: null,
      primaryEmailAddress: { emailAddress: 'user@example.com' },
    }

    const mockRefetchMe = vi.fn().mockResolvedValue({})
    const mockUpdateUserFn = vi
      .fn()
      .mockResolvedValue({ data: { updateUser: { id: '1' } } })

    mockUser.mockReturnValue({
      user: mockClerkUser,
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: {
        me: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          role: UserRole.Client,
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
      loading: false,
      refetch: mockRefetchMe,
    })
    mockUpdateUser.mockReturnValue([
      mockUpdateUserFn,
      { loading: false, error: null },
    ])

    render(<UserProfile />)

    const editButton = screen.getByText('EDIT PROFILE')
    fireEvent.click(editButton)

    const firstNameInput = screen.getByLabelText('FIRST NAME')
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } })

    const submitButton = screen.getByText('SAVE CHANGES')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockUpdateUserFn).toHaveBeenCalledWith({
        variables: {
          id: '1',
          input: {
            firstName: 'Jane',
            lastName: 'Doe',
          },
        },
      })
    })

    await waitFor(() => {
      expect(mockRefetchMe).toHaveBeenCalled()
    })
  })

  it('shows loading state during form submission', async () => {
    const mockClerkUser = {
      id: '1',
      imageUrl: null,
      primaryEmailAddress: { emailAddress: 'user@example.com' },
    }

    const mockRefetchMe = vi.fn().mockResolvedValue({})
    const mockUpdateUserFn = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

    mockUser.mockReturnValue({
      user: mockClerkUser,
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: {
        me: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          role: UserRole.Client,
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
      loading: false,
      refetch: mockRefetchMe,
    })
    mockUpdateUser.mockReturnValue([
      mockUpdateUserFn,
      { loading: false, error: null },
    ])

    render(<UserProfile />)

    const editButton = screen.getByText('EDIT PROFILE')
    fireEvent.click(editButton)

    const submitButton = screen.getByText('SAVE CHANGES')
    fireEvent.click(submitButton)

    expect(screen.getByText('SAVING...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.queryByText('SAVING...')).not.toBeInTheDocument()
    })
  })

  it('handles update user error gracefully', async () => {
    const mockClerkUser = {
      id: '1',
      imageUrl: null,
      primaryEmailAddress: { emailAddress: 'user@example.com' },
    }

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const mockRefetchMe = vi.fn().mockResolvedValue({})
    const mockUpdateUserFn = vi
      .fn()
      .mockRejectedValue(new Error('Update failed'))

    mockUser.mockReturnValue({
      user: mockClerkUser,
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: {
        me: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          role: UserRole.Client,
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
      loading: false,
      refetch: mockRefetchMe,
    })
    mockUpdateUser.mockReturnValue([
      mockUpdateUserFn,
      { loading: false, error: null },
    ])

    render(<UserProfile />)

    const editButton = screen.getByText('EDIT PROFILE')
    fireEvent.click(editButton)

    const submitButton = screen.getByText('SAVE CHANGES')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error updating user:',
        expect.any(Error)
      )
    })

    consoleSpy.mockRestore()
  })

  it('handles missing user ID gracefully', async () => {
    const mockClerkUser = {
      id: '1',
      imageUrl: null,
      primaryEmailAddress: { emailAddress: 'user@example.com' },
    }

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const mockUpdateUserFn = vi
      .fn()
      .mockResolvedValue({ data: { updateUser: { id: '1' } } })

    mockUser.mockReturnValue({
      user: mockClerkUser,
      isLoaded: true,
    })
    mockGetMe.mockReturnValue({
      data: {
        me: null,
      },
      loading: false,
    })
    mockUpdateUser.mockReturnValue([
      mockUpdateUserFn,
      { loading: false, error: null },
    ])

    render(<UserProfile />)

    // Should show loading state when me data is null
    expect(screen.getByText('LOADING...')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})
