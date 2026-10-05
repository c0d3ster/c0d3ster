import type { ProjectRequestData } from '@/validations'

export type FieldErrors = Partial<Record<keyof ProjectRequestData, string>>

// Returns a ref callback for a named field so the container can focus the first invalid one
export type RegisterField = (field: string) => (el: HTMLElement | null) => void

export const labelClassName =
  'block font-mono text-sm font-medium text-green-300'

export const inputClassName =
  'mt-2 block w-full rounded border border-green-400/30 bg-black/50 px-4 py-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 focus:outline-none'

// Reserves space for the message so the layout does not jump when an error appears
export const FieldError = ({ error }: { error?: string }): React.ReactElement => (
  <div className='mt-1 h-5 font-mono text-sm text-red-400'>
    {error && <p>{error}</p>}
  </div>
)
