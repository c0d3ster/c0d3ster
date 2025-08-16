import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LocaleSwitcher } from './LocaleSwitcher'

// Mock next-intl hooks
vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl')
  return {
    ...actual,
    useLocale: vi.fn(() => 'en'),
  }
})

// Mock navigation hooks
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    refresh: mockRefresh,
  })),
}))

vi.mock('@/libs/I18nNavigation', () => ({
  usePathname: vi.fn(() => '/test-path'),
}))

// Mock routing configuration
vi.mock('@/libs/I18nRouting', () => ({
  routing: {
    locales: ['en', 'fr'],
  },
}))

const mockMessages = {}

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup() // Clean up any previous renders
  })

  afterEach(() => {
    cleanup() // Clean up after each test
  })

  const renderWithIntl = (component: React.ReactNode) => {
    return render(
      <NextIntlClientProvider locale='en' messages={mockMessages}>
        {component}
      </NextIntlClientProvider>
    )
  }

  it('renders select element', () => {
    renderWithIntl(<LocaleSwitcher />)

    const select = screen.getByRole('combobox', { name: 'lang-switcher' })

    expect(select).toBeInTheDocument()
  })

  it('has correct aria-label', () => {
    renderWithIntl(<LocaleSwitcher />)

    const select = screen.getByLabelText('lang-switcher')

    expect(select).toBeInTheDocument()
  })

  it('displays available locales as options', () => {
    renderWithIntl(<LocaleSwitcher />)

    const enOption = screen.getByRole('option', { name: 'EN' })
    const frOption = screen.getByRole('option', { name: 'FR' })

    expect(enOption).toBeInTheDocument()
    expect(frOption).toBeInTheDocument()
  })

  it('sets current locale as default value', () => {
    renderWithIntl(<LocaleSwitcher />)

    const select = screen.getByRole('combobox') as HTMLSelectElement

    expect(select.value).toBe('en')
  })

  it('handles locale change', async () => {
    const user = userEvent.setup()
    renderWithIntl(<LocaleSwitcher />)

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'fr')

    expect(mockPush).toHaveBeenCalledWith('/fr/test-path')
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('converts locale to uppercase in option text', () => {
    renderWithIntl(<LocaleSwitcher />)

    const options = screen.getAllByRole('option')

    expect(options[0]).toHaveTextContent('EN')
    expect(options[1]).toHaveTextContent('FR')
  })

  it('maintains option values as lowercase', () => {
    renderWithIntl(<LocaleSwitcher />)

    const enOption = screen.getByRole('option', {
      name: 'EN',
    }) as HTMLOptionElement
    const frOption = screen.getByRole('option', {
      name: 'FR',
    }) as HTMLOptionElement

    expect(enOption.value).toBe('en')
    expect(frOption.value).toBe('fr')
  })

  it('handles empty pathname correctly', async () => {
    const { usePathname } = await import('@/libs/I18nNavigation')
    vi.mocked(usePathname).mockReturnValue('')

    const user = userEvent.setup()
    renderWithIntl(<LocaleSwitcher />)

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'fr')

    expect(mockPush).toHaveBeenCalledWith('/fr')
  })
})
