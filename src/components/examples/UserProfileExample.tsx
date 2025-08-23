'use client'

import type { UpdateUserInput } from '@/graphql/generated/graphql'

import { UserApiClient } from '@/apiClients'

// Example component showing how to use the clean API client pattern
export default function UserProfileExample() {
  // Use the generated hooks directly from the API client
  const { data, loading, error } = UserApiClient.useGetMe()
  const [updateUser] = UserApiClient.useUpdateUser()

  const handleUpdateUser = async (updates: UpdateUserInput) => {
    if (!data?.me) return

    try {
      await updateUser({
        variables: {
          id: data.me.id,
          input: updates,
        },
      })
    } catch (err) {
      console.error('Failed to update user:', err)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data?.me) return <div>No user found</div>

  const user = data.me

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <h1 className='mb-6 text-2xl font-bold'>User Profile</h1>

      <div className='rounded-lg bg-white p-6 shadow'>
        <div className='mb-6 grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              First Name
            </label>
            <input
              type='text'
              defaultValue={user.firstName || ''}
              className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2'
              onBlur={(e) => handleUpdateUser({ firstName: e.target.value })}
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Last Name
            </label>
            <input
              type='text'
              defaultValue={user.lastName || ''}
              className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2'
              onBlur={(e) => handleUpdateUser({ lastName: e.target.value })}
            />
          </div>
        </div>

        <div className='mb-6'>
          <label className='block text-sm font-medium text-gray-700'>Bio</label>
          <textarea
            defaultValue={user.bio || ''}
            rows={3}
            className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2'
            onBlur={(e) => handleUpdateUser({ bio: e.target.value })}
          />
        </div>

        <div className='mb-6'>
          <label className='block text-sm font-medium text-gray-700'>
            Skills
          </label>
          <input
            type='text'
            defaultValue={user.skills?.join(', ') || ''}
            className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2'
            placeholder='React, TypeScript, GraphQL'
            onBlur={(e) =>
              handleUpdateUser({
                skills: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Hourly Rate
            </label>
            <input
              type='number'
              defaultValue={user.hourlyRate || 0}
              className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2'
              onBlur={(e) =>
                handleUpdateUser({
                  hourlyRate: Number.parseFloat(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Availability
            </label>
            <select
              defaultValue={user.availability || ''}
              className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2'
              onChange={(e) =>
                handleUpdateUser({ availability: e.target.value })
              }
            >
              <option value=''>Select availability</option>
              <option value='Full-time'>Full-time</option>
              <option value='Part-time'>Part-time</option>
              <option value='Contract'>Contract</option>
              <option value='Freelance'>Freelance</option>
            </select>
          </div>
        </div>

        <div className='mt-6 text-sm text-gray-500'>
          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>
          <p>Member since: {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}
