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

export const CompactUserProfile = () => {
  const { user, isLoaded } = useUser()
  const [userData, setUserData] = useState<UserData | null>(null)

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
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

  if (!isLoaded || !user) {
    return (
      <div className='flex animate-pulse flex-col items-center space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4'>
        <div className='h-12 w-12 rounded-full bg-green-400/20'></div>
        <div className='space-y-2 text-center sm:text-left'>
          <div className='h-4 w-32 rounded bg-green-400/20'></div>
          <div className='h-3 w-24 rounded bg-green-400/10'></div>
        </div>
      </div>
    )
  }

  const displayName = userData
    ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
      user.emailAddresses[0]?.emailAddress ||
      'User'
    : user.fullName || user.emailAddresses[0]?.emailAddress || 'User'

  return (
    <div className='flex flex-col items-center space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4'>
      {/* Avatar */}
      <div className='relative h-12 w-12 overflow-hidden rounded-full border-2 border-green-400/30 sm:h-12 sm:w-12'>
        {user.imageUrl ? (
          <Image
            src={user.imageUrl}
            alt={displayName}
            fill
            className='object-cover'
            sizes='48px'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-green-400/20 font-mono text-lg font-bold text-green-400'>
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name and Email */}
      <div className='min-w-0 flex-1 text-center sm:text-left'>
        <h2 className='truncate font-mono text-lg font-bold text-green-400'>
          {displayName}
        </h2>
        <p className='truncate font-mono text-sm text-green-300/70'>
          {user.emailAddresses[0]?.emailAddress}
        </p>
      </div>
    </div>
  )
}
