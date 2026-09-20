import { describe, expect, it } from 'vitest'

import { ProjectType } from '@/graphql/generated/graphql'

import { projectRequestSchema } from './ProjectRequestValidation'

const validBase = {
  projectName: 'My Store',
  description: 'A detailed description of the project',
  projectType: ProjectType.Website,
}

describe('projectRequestSchema', () => {
  it('treats empty title as omitted so it can default to project name', () => {
    const result = projectRequestSchema.safeParse({
      ...validBase,
      title: '',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.title).toBeUndefined()
    }
  })

  it('treats whitespace-only title as omitted', () => {
    const result = projectRequestSchema.safeParse({
      ...validBase,
      title: '   ',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.title).toBeUndefined()
    }
  })

  it('keeps a provided title after trimming', () => {
    const result = projectRequestSchema.safeParse({
      ...validBase,
      title: '  Handmade Goods Store  ',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.title).toBe('Handmade Goods Store')
    }
  })
})
