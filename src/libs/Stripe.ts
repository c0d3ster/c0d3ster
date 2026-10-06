import Stripe from 'stripe'

import { Env } from '@/libs/Env'

let stripe: Stripe | undefined

export const getStripe = (): Stripe => {
  if (stripe) return stripe
  if (!Env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  stripe = new Stripe(Env.STRIPE_SECRET_KEY)
  return stripe
}
