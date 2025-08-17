'use client'

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

export const UserProfile = () => {
  const { user, isLoaded } = useUser()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserData()
    }
  }, [isLoaded, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchUserData()
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error updating user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded) {
    return <div className='animate-pulse'>Loading...</div>
  }

  if (!user) {
    return <div>Please sign in to view your profile.</div>
  }

  return (
    <div className='mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-md'>
      <div className='mb-6 flex items-center space-x-4'>
        {user.imageUrl && (
          <img
            src={user.imageUrl}
            alt='Profile'
            className='h-16 w-16 rounded-full'
          />
        )}
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>
            {userData?.firstName && userData?.lastName
              ? `${userData.firstName} ${userData.lastName}`
              : 'Complete your profile'}
          </h2>
          <p className='text-gray-600'>
            {userData?.email || user.primaryEmailAddress?.emailAddress}
          </p>
        </div>
      </div>

      {!isEditing ? (
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <span className='block text-sm font-medium text-gray-700'>
                First Name
              </span>
              <p className='mt-1 text-sm text-gray-900'>
                {userData?.firstName || 'Not set'}
              </p>
            </div>
            <div>
              <span className='block text-sm font-medium text-gray-700'>
                Last Name
              </span>
              <p className='mt-1 text-sm text-gray-900'>
                {userData?.lastName || 'Not set'}
              </p>
            </div>
          </div>
          <div>
            <span className='block text-sm font-medium text-gray-700'>
              Member Since
            </span>
            <p className='mt-1 text-sm text-gray-900'>
              {userData?.createdAt
                ? new Date(userData.createdAt).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
          <button
            type='button'
            onClick={() => setIsEditing(true)}
            className='rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
          >
            Edit Profile
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='firstName'
                className='block text-sm font-medium text-gray-700'
              >
                First Name
              </label>
              <input
                id='firstName'
                type='text'
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none'
              />
            </div>
            <div>
              <label
                htmlFor='lastName'
                className='block text-sm font-medium text-gray-700'
              >
                Last Name
              </label>
              <input
                id='lastName'
                type='text'
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none'
              />
            </div>
          </div>
          <div className='flex space-x-3'>
            <button
              type='submit'
              disabled={isLoading}
              className='rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50'
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type='button'
              onClick={() => setIsEditing(false)}
              className='rounded-md bg-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-400'
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
