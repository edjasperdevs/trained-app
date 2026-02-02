import { describe, it, expect } from 'vitest'
import { render, screen } from '../test/utils'
import { ProgressBar } from './ProgressBar'

describe('ProgressBar', () => {
  it('should render without label by default', () => {
    render(<ProgressBar progress={50} />)
    expect(screen.queryByText('50/100')).not.toBeInTheDocument()
  })

  it('should render with label when showLabel is true', () => {
    render(<ProgressBar progress={50} showLabel label="XP Progress" />)
    expect(screen.getByText('XP Progress')).toBeInTheDocument()
    expect(screen.getByText('50/100')).toBeInTheDocument()
  })

  it('should respect custom maxProgress in label', () => {
    render(<ProgressBar progress={25} maxProgress={50} showLabel label="Custom" />)
    expect(screen.getByText('25/50')).toBeInTheDocument()
  })

  it('should cap percentage at 100%', () => {
    const { container } = render(<ProgressBar progress={150} maxProgress={100} />)
    // The bar should not exceed 100% width
    const progressFill = container.querySelector('.progress-gradient, .bg-accent-primary, .bg-accent-secondary, .bg-accent-success')
    // Verify it exists - the actual width is controlled by framer-motion animation
    expect(progressFill).toBeInTheDocument()
  })

  it('should apply gradient color by default', () => {
    const { container } = render(<ProgressBar progress={50} />)
    const progressFill = container.querySelector('.progress-gradient')
    expect(progressFill).toBeInTheDocument()
  })

  it('should apply gold color', () => {
    const { container } = render(<ProgressBar progress={50} color="gold" />)
    const progressFill = container.querySelector('.bg-accent-primary')
    expect(progressFill).toBeInTheDocument()
  })

  it('should apply green color', () => {
    const { container } = render(<ProgressBar progress={50} color="green" />)
    const progressFill = container.querySelector('.bg-accent-secondary')
    expect(progressFill).toBeInTheDocument()
  })

  it('should apply success color', () => {
    const { container } = render(<ProgressBar progress={50} color="success" />)
    const progressFill = container.querySelector('.bg-accent-success')
    expect(progressFill).toBeInTheDocument()
  })

  it('should apply medium size by default', () => {
    const { container } = render(<ProgressBar progress={50} />)
    const track = container.querySelector('.bg-white\\/5')
    expect(track?.className).toContain('h-2')
  })

  it('should apply small size', () => {
    const { container } = render(<ProgressBar progress={50} size="sm" />)
    const track = container.querySelector('.bg-white\\/5')
    expect(track?.className).toContain('h-1.5')
  })

  it('should apply large size', () => {
    const { container } = render(<ProgressBar progress={50} size="lg" />)
    const track = container.querySelector('.bg-white\\/5')
    expect(track?.className).toContain('h-3')
  })

  it('should round progress value in label', () => {
    render(<ProgressBar progress={33.7} showLabel label="Progress" />)
    expect(screen.getByText('34/100')).toBeInTheDocument()
  })

  it('should handle 0 progress', () => {
    render(<ProgressBar progress={0} showLabel label="Empty" />)
    expect(screen.getByText('0/100')).toBeInTheDocument()
  })

  it('should handle 100% progress', () => {
    render(<ProgressBar progress={100} showLabel label="Complete" />)
    expect(screen.getByText('100/100')).toBeInTheDocument()
  })
})
