'use client'

import type { ChangeEventHandler } from 'react'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'

import { usePathname } from '@/libs/I18nNavigation'
import { routing } from '@/libs/I18nRouting'

export const LocaleSwitcher = () => {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()

  const handleChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    router.push(`/${event.target.value}${pathname}`)
    router.refresh() // Ensure the page takes the new locale into account related to the issue #395
  }

  return (
    <select
      defaultValue={locale}
      onChange={handleChange}
      className='rounded-lg border border-green-400/30 bg-black/50 px-3 py-2 font-mono text-sm text-green-400 transition-all duration-200 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 focus:outline-none'
      aria-label='lang-switcher'
    >
      {routing.locales.map((elt) => (
        <option key={elt} value={elt} className='bg-black text-green-400'>
          {elt.toUpperCase()}
        </option>
      ))}
    </select>
  )
}
