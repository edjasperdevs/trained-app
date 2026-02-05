import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../test/utils'
import { Card } from './Card'

describe('Card', () => {
  it('should render children', () => {
    render(<Card>Card Content</Card>)
    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('should render as div by default', () => {
    render(<Card>Content</Card>)
    const card = screen.getByText('Content').closest('div')
    expect(card).toBeInTheDocument()
  })

  it('should render as button when onClick is provided', () => {
    render(<Card onClick={() => {}}>Clickable</Card>)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Card onClick={handleClick}>Click Me</Card>)

    fireEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should apply default variant styles', () => {
    render(<Card>Content</Card>)
    const card = screen.getByText('Content').closest('div')
    // Trained theme uses bg-surface for default variant
    expect(card?.className).toContain('bg-surface')
    expect(card?.className).toContain('border')
  })

  it('should apply elevated variant', () => {
    render(<Card variant="elevated">Content</Card>)
    const card = screen.getByText('Content').closest('div')
    // Trained theme uses bg-surface-elevated
    expect(card?.className).toContain('bg-surface-elevated')
  })

  it('should apply subtle variant', () => {
    render(<Card variant="subtle">Content</Card>)
    const card = screen.getByText('Content').closest('div')
    // Trained theme uses bg-surface/50
    expect(card?.className).toContain('bg-surface/50')
  })

  it('should apply medium padding by default', () => {
    render(<Card>Content</Card>)
    const card = screen.getByText('Content').closest('div')
    expect(card?.className).toContain('p-4')
  })

  it('should apply small padding', () => {
    render(<Card padding="sm">Content</Card>)
    const card = screen.getByText('Content').closest('div')
    expect(card?.className).toContain('p-3')
  })

  it('should apply large padding', () => {
    render(<Card padding="lg">Content</Card>)
    const card = screen.getByText('Content').closest('div')
    expect(card?.className).toContain('p-6')
  })

  it('should apply no padding', () => {
    render(<Card padding="none">Content</Card>)
    const card = screen.getByText('Content').closest('div')
    expect(card?.className).not.toContain('p-')
  })

  it('should apply hover class when hover is true', () => {
    render(<Card hover>Hoverable</Card>)
    const card = screen.getByText('Hoverable').closest('div')
    expect(card?.className).toContain('card-hover')
    expect(card?.className).toContain('cursor-pointer')
  })

  it('should apply custom className', () => {
    render(<Card className="custom-class">Content</Card>)
    const card = screen.getByText('Content').closest('div')
    expect(card?.className).toContain('custom-class')
  })

  it('should apply w-full when used as button', () => {
    render(<Card onClick={() => {}}>Button Card</Card>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('w-full')
    expect(button.className).toContain('text-left')
  })

  it('should not use glass or backdrop-blur on any variant', () => {
    const variants = ['default', 'elevated', 'subtle'] as const
    variants.forEach((variant) => {
      const { container } = render(<Card variant={variant}>No Glass</Card>)
      const card = container.firstChild as HTMLElement
      expect(card.className).not.toContain('backdrop-blur')
      expect(card.className).not.toContain('glass')
    })
  })
})
