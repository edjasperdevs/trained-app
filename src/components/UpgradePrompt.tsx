/**
 * UpgradePrompt Component
 *
 * Fallback UI shown when non-premium users attempt to access gated content.
 * Displays upgrade call-to-action and navigates to /paywall.
 *
 * Web users: Returns null (no IAP on web, content accessible)
 * Native users: Shows upgrade prompt with configurable variants
 */

import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { isNative } from '@/lib/platform'

interface UpgradePromptProps {
  /** Optional feature name: "specialized archetypes", "weekly quests", etc. */
  feature?: string
  /** Display variant - inline (minimal), card (default), fullscreen (modal-like) */
  variant?: 'inline' | 'card' | 'fullscreen'
}

export function UpgradePrompt({ feature, variant = 'card' }: UpgradePromptProps) {
  const navigate = useNavigate()

  // Web users bypass - no IAP on web platform
  if (!isNative()) {
    return null
  }

  const featureText = feature ? feature : 'this feature'
  const handleUpgrade = () => navigate('/paywall')

  // Inline variant - minimal text with link
  if (variant === 'inline') {
    return (
      <p className="text-sm text-muted-foreground">
        Upgrade to Premium to unlock {featureText}.{' '}
        <button
          onClick={handleUpgrade}
          className="text-signal font-medium hover:underline"
        >
          Upgrade
        </button>
      </p>
    )
  }

  // Fullscreen variant - centered modal-like prompt
  if (variant === 'fullscreen') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Premium Feature
        </h2>
        <p className="text-muted-foreground mb-6 max-w-xs">
          Upgrade to unlock <span className="text-signal">{featureText}</span> and
          get full access to all premium features.
        </p>
        <button
          onClick={handleUpgrade}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          Upgrade to Premium
        </button>
      </div>
    )
  }

  // Card variant (default) - card with icon, description, and CTA
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center flex-shrink-0">
          <Lock className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1">Premium Feature</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Upgrade to unlock <span className="text-signal">{featureText}</span>.
          </p>
          <button
            onClick={handleUpgrade}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    </div>
  )
}
