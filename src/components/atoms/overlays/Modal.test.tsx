import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Modal } from './Modal'

describe('Modal', () => {
  it('renders the title and children', () => {
    render(
      <Modal title='UPLOAD FILE' onClose={vi.fn()}>
        <p>content</p>
      </Modal>
    )

    expect(screen.getByText('UPLOAD FILE')).toBeInTheDocument()
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal title='UPLOAD FILE' onClose={onClose}>
        <p>content</p>
      </Modal>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <Modal title='UPLOAD FILE' onClose={onClose}>
        <p>content</p>
      </Modal>
    )

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal title='UPLOAD FILE' onClose={onClose}>
        <p>content</p>
      </Modal>
    )

    fireEvent.click(screen.getByTestId('modal-backdrop'))

    expect(onClose).toHaveBeenCalled()
  })

  it('does not call onClose when clicking inside the modal content', () => {
    const onClose = vi.fn()
    render(
      <Modal title='UPLOAD FILE' onClose={onClose}>
        <p>content</p>
      </Modal>
    )

    fireEvent.click(screen.getByText('content'))

    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders into document.body via a portal', () => {
    const { container } = render(
      <Modal title='UPLOAD FILE' onClose={vi.fn()}>
        <p>content</p>
      </Modal>
    )

    expect(container).toBeEmptyDOMElement()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
