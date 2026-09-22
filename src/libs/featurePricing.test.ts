import { describe, expect, it } from 'vitest'

import { ProjectFeature } from '@/graphql/schema'

import { featurePricing } from './featurePricing'

describe('featurePricing', () => {
  it('covers every ProjectFeature enum value', () => {
    for (const feature of Object.values(ProjectFeature)) {
      expect(featurePricing[feature]).toBeDefined()
    }
  })

  it('gives every entry a label, defaultPrice, and description', () => {
    for (const pricing of Object.values(featurePricing)) {
      expect(typeof pricing.label).toBe('string')
      expect(pricing.label.length).toBeGreaterThan(0)
      expect(typeof pricing.defaultPrice).toBe('number')
      expect(pricing.defaultPrice).toBeGreaterThan(0)
      expect(typeof pricing.description).toBe('string')
      expect(pricing.description.length).toBeGreaterThan(0)
    }
  })

  it('keeps the existing Database, Auth, and Email entries valid', () => {
    expect(featurePricing[ProjectFeature.Database].defaultPrice).toBe(550)
    expect(featurePricing[ProjectFeature.Auth].defaultPrice).toBe(350)
    expect(featurePricing[ProjectFeature.Email].defaultPrice).toBe(225)
  })
})
