'use client'

import { useUser } from '@clerk/nextjs'
import Image from 'next/image'

import { useGetMe } from '@/apiClients/userApiClient'
import { AdminBadge, ClientBadge, DevBadge } from '@/components/atoms'
import { UserRole } from '@/graphql/generated/graphql'
import { isAdminRole } from '@/utils'

export const CompactUserProfile = () => {
  const { user: clerkUser, isLoaded } = useUser()
  const { data: userData, loading: isLoading } = useGetMe()
  const userRole = userData?.me?.role
  const isAdmin = isAdminRole(userRole)
  const isDeveloper = userRole === UserRole.Developer

  if (!isLoaded || isLoading || !clerkUser) {
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

  const displayName = userData?.me
    ? `${userData.me.firstName || ''} ${userData.me.lastName || ''}`.trim() ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      'User'
    : clerkUser.fullName || clerkUser.emailAddresses[0]?.emailAddress || 'User'

  return (
    <div className='flex flex-col items-center space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4'>
      {/* Avatar */}
      <div className='relative h-12 w-12 overflow-hidden rounded-full border-2 border-green-400/30 sm:h-12 sm:w-12'>
        {clerkUser.imageUrl ? (
          <Image
            src={clerkUser.imageUrl}
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
        <div className='flex items-center justify-center gap-2 sm:justify-start'>
          <h2 className='truncate font-mono text-lg font-bold text-green-400'>
            {displayName}
          </h2>
          {isAdmin && <AdminBadge />}
          {isDeveloper && !isAdmin && <DevBadge />}
          {!isAdmin && !isDeveloper && <ClientBadge />}
        </div>
        <p className='truncate font-mono text-sm text-green-300/70'>
          {clerkUser.emailAddresses[0]?.emailAddress}
        </p>
      </div>
    </div>
  )
}
