import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

type UserData = {
  id: string
  clerkId: string
  email: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export const useUserData = () => {
  const { user, isLoaded } = useUser()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/users')

      if (response.ok) {
        const data = await response.json()
        setUserData(data)
      } else {
        setError('Failed to fetch user data')
      }
    } catch (err) {
      setError('Error fetching user data')
      console.error('Error fetching user data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserData()
    }
  }, [isLoaded, user])

  const updateUserData = async (
    updates: Partial<Pick<UserData, 'firstName' | 'lastName' | 'avatarUrl'>>
  ) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        const updatedData = await response.json()
        setUserData(updatedData)
        return { success: true, data: updatedData }
      } else {
        setError('Failed to update user data')
        return { success: false, error: 'Failed to update user data' }
      }
    } catch (err) {
      setError('Error updating user data')
      console.error('Error updating user data:', err)
      return { success: false, error: 'Error updating user data' }
    } finally {
      setIsLoading(false)
    }
  }

  const createUserData = async (
    userData: Pick<UserData, 'email' | 'firstName' | 'lastName' | 'avatarUrl'>
  ) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        const newData = await response.json()
        setUserData(newData)
        return { success: true, data: newData }
      } else {
        setError('Failed to create user data')
        return { success: false, error: 'Failed to create user data' }
      }
    } catch (err) {
      setError('Error creating user data')
      console.error('Error creating user data:', err)
      return { success: false, error: 'Error creating user data' }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    userData,
    isLoading,
    error,
    fetchUserData,
    updateUserData,
    createUserData,
    isLoaded,
    user,
  }
}
