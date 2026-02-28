/**
 * PremiumGate Component
 *
 * Wrapper component for premium-only content. Checks subscription status
 * and renders either children (for premium/web users) or a fallback prompt.
 *
 * Web users: Always see content (no IAP on web platform)
 * Premium users: Always see content
 * Non-premium native users: See UpgradePrompt or custom fallback
 *
 * Usage by future phases:
 * - Phase 21 (Archetypes): Wrap specialized archetype selection
 * - Phase 22 (Quests): Wrap weekly quest features
 * - Phase 23 (Avatar): Wrap avatar stages 3-5
 *
 * @example
 * // Route-level gating (fullscreen fallback)
 * <PremiumGate feature="Specialized Archetypes" variant="fullscreen">
 *   <ArchetypeSelector />
 * </PremiumGate>
 *
 * @example
 * // Feature-level gating (card fallback)
 * <PremiumGate feature="Weekly Quests">
 *   <WeeklyQuestCard />
 * </PremiumGate>
 *
 * @example
 * // Custom fallback
 * <PremiumGate fallback={<LockedAvatarStage stage={3} />}>
 *   <AvatarStage stage={3} />
 * </PremiumGate>
 */

import type { ReactNode } from 'react'
import { useSubscriptionStore } from '@/stores'
import { isNative } from '@/lib/platform'
import { UpgradePrompt } from './UpgradePrompt'

interface PremiumGateProps {
  /** Content to render for premium/web users */
  children: ReactNode
  /** Custom fallback UI (default: UpgradePrompt) */
  fallback?: ReactNode
  /** Feature name passed to UpgradePrompt (e.g., "specialized archetypes") */
  feature?: string
  /** UpgradePrompt variant: inline, card (default), fullscreen */
  variant?: 'inline' | 'card' | 'fullscreen'
}

export function PremiumGate({
  children,
  fallback,
  feature,
  variant = 'card',
}: PremiumGateProps) {
  const isPremium = useSubscriptionStore((s) => s.isPremium)

  // Web users bypass gate - no IAP on web platform
  if (!isNative()) {
    return <>{children}</>
  }

  // Premium users see content
  if (isPremium) {
    return <>{children}</>
  }

  // Non-premium native users see fallback
  return <>{fallback ?? <UpgradePrompt feature={feature} variant={variant} />}</>
}
