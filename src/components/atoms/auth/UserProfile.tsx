'use client'

import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
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
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='font-mono text-green-400'>LOADING...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className='text-center font-mono text-green-300'>
        Please sign in to view your profile.
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Profile Header */}
      <div className='flex items-center space-x-6'>
        {user.imageUrl && (
          <Image
            src={user.imageUrl}
            alt='Profile'
            width={80}
            height={80}
            className='h-20 w-20 rounded-full border-2 border-green-400/50 shadow-lg'
          />
        )}
        <div>
          <h2 className='font-mono text-2xl font-bold text-green-400'>
            {userData?.firstName && userData?.lastName
              ? `${userData.firstName} ${userData.lastName}`
              : 'COMPLETE YOUR PROFILE'}
          </h2>
          <p className='font-mono text-green-300/80'>
            {userData?.email || user.primaryEmailAddress?.emailAddress}
          </p>
        </div>
      </div>

      {!isEditing ? (
        <div className='space-y-6'>
          <div className='grid gap-6 md:grid-cols-2'>
            <div>
              <span className='block font-mono text-sm font-medium text-green-300'>
                FIRST NAME
              </span>
              <p className='mt-2 font-mono text-lg text-green-400'>
                {userData?.firstName || 'Not set'}
              </p>
            </div>
            <div>
              <span className='block font-mono text-sm font-medium text-green-300'>
                LAST NAME
              </span>
              <p className='mt-2 font-mono text-lg text-green-400'>
                {userData?.lastName || 'Not set'}
              </p>
            </div>
          </div>
          <div>
            <span className='block font-mono text-sm font-medium text-green-300'>
              MEMBER SINCE
            </span>
            <p className='mt-2 font-mono text-lg text-green-400'>
              {userData?.createdAt
                ? new Date(userData.createdAt).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
          <button
            type='button'
            onClick={() => setIsEditing(true)}
            className='rounded border border-green-400 bg-green-400/10 px-6 py-3 font-mono font-bold text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black'
          >
            EDIT PROFILE
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='grid gap-6 md:grid-cols-2'>
            <div>
              <label
                htmlFor='firstName'
                className='block font-mono text-sm font-medium text-green-300'
              >
                FIRST NAME
              </label>
              <input
                id='firstName'
                type='text'
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className='mt-2 block w-full rounded border border-green-400/30 bg-black/50 px-4 py-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 focus:outline-none'
                placeholder='Enter first name'
              />
            </div>
            <div>
              <label
                htmlFor='lastName'
                className='block font-mono text-sm font-medium text-green-300'
              >
                LAST NAME
              </label>
              <input
                id='lastName'
                type='text'
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className='mt-2 block w-full rounded border border-green-400/30 bg-black/50 px-4 py-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 focus:outline-none'
                placeholder='Enter last name'
              />
            </div>
          </div>
          <div className='flex space-x-4'>
            <button
              type='submit'
              disabled={isLoading}
              className='rounded border border-green-400 bg-green-400/10 px-6 py-3 font-mono font-bold text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
            <button
              type='button'
              onClick={() => setIsEditing(false)}
              className='rounded border border-gray-400/30 bg-gray-400/10 px-6 py-3 font-mono font-bold text-gray-400 transition-all duration-300 hover:bg-gray-400 hover:text-black'
            >
              CANCEL
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
