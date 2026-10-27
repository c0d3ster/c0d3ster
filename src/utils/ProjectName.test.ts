import { beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/libs/DB'

import { assertProjectNameAvailable } from './ProjectName'

describe('assertProjectNameAvailable', () => {
  const mockFindMany = vi.mocked(db.query.projects.findMany)

  beforeEach(() => {
    vi.clearAllMocks()
    mockFindMany.mockResolvedValue([
      { id: 'a', projectName: 'Synthetic Daily' },
      { id: 'b', projectName: 'Other Project' },
    ] as Awaited<ReturnType<typeof db.query.projects.findMany>>)
  })

  it('should resolve when no project has the same slug', async () => {
    await expect(
      assertProjectNameAvailable('Brand New Project')
    ).resolves.toBeUndefined()
  })

  it('should throw DUPLICATE_SLUG for an identical name', async () => {
    await expect(
      assertProjectNameAvailable('Synthetic Daily')
    ).rejects.toMatchObject({ extensions: { code: 'DUPLICATE_SLUG' } })
  })

  it('should throw when only the casing or punctuation differs', async () => {
    await expect(
      assertProjectNameAvailable('  synthetic   DAILY!! ')
    ).rejects.toMatchObject({ extensions: { code: 'DUPLICATE_SLUG' } })
  })

  it('should allow a project to keep its own name', async () => {
    await expect(
      assertProjectNameAvailable('Synthetic Daily', 'a')
    ).resolves.toBeUndefined()
  })

  it('should still reject a name used by a different project when excluding one', async () => {
    await expect(
      assertProjectNameAvailable('Other Project', 'a')
    ).rejects.toMatchObject({ extensions: { code: 'DUPLICATE_SLUG' } })
  })
})
