/**
 * ProtocolOrders Component
 *
 * Displays daily and weekly Protocol Orders (quests) with auto-completion detection.
 * - Daily: 3 quests shown to all users
 * - Weekly: 2 quests shown to premium users (locked preview for non-premium)
 *
 * Quests auto-complete when their conditions are met, awarding bonus DP.
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Lock, Crown, Utensils, Beef, Dumbbell, Footprints, Moon, Flame, CheckCircle, Pizza, Star, UtensilsCrossed, FlameKindling, type LucideIcon } from 'lucide-react'
import { useQuestStore } from '@/stores/questStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { useMacroStore } from '@/stores/macroStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useHealthStore } from '@/stores/healthStore'
import { useDPStore } from '@/stores/dpStore'
import { cn } from '@/lib/cn'
import { LABELS } from '@/design/constants'
import { getLocalDateString, getLocalWeekString } from '@/lib/dateUtils'
import { WEEKLY_QUESTS } from '@/lib/questCatalog'
import type { QuestDefinition } from '@/lib/questCatalog'

// Icon mapping from questCatalog icon names to lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  beef: Beef,
  dumbbell: Dumbbell,
  footprints: Footprints,
  moon: Moon,
  flame: Flame,
  'check-circle': CheckCircle,
  pizza: Pizza,
  star: Star,
  'utensils-crossed': UtensilsCrossed,
  'flame-kindling': FlameKindling,
  crown: Crown,
  // Fallbacks for any icon name variations
  'shoe-prints': Footprints,
}

// Subscribe to store changes for auto-completion checks (module level to avoid multiple subscriptions)
let subscriptionsInitialized = false

function initializeStoreSubscriptions() {
  if (subscriptionsInitialized) return
  subscriptionsInitialized = true

  const checkQuests = () => {
    useQuestStore.getState().checkAndCompleteQuests()
  }

  // Subscribe to stores that affect quest conditions
  useMacroStore.subscribe(checkQuests)
  useWorkoutStore.subscribe(checkQuests)
  useHealthStore.subscribe(checkQuests)
  useDPStore.subscribe(checkQuests)
}

// Seeded shuffle for deterministic quest preview for non-premium users
function seededShuffle<T>(array: T[], seed: string): T[] {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash = hash & hash
  }

  const result = [...array]
  let m = result.length
  while (m) {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff
    const i = hash % m--
    ;[result[m], result[i]] = [result[i], result[m]]
  }
  return result
}

export function ProtocolOrders() {
  const navigate = useNavigate()
  const { getActiveQuests, checkAndCompleteQuests, isQuestCompleted } = useQuestStore()
  const isPremium = useSubscriptionStore((s) => s.isPremium)

  // Initialize store subscriptions on mount
  useEffect(() => {
    initializeStoreSubscriptions()
  }, [])

  // Check for quest completion on mount
  useEffect(() => {
    checkAndCompleteQuests()
  }, [checkAndCompleteQuests])

  const activeQuests = getActiveQuests()
  const dailyQuests = activeQuests.filter(q => q.type === 'daily')
  const weeklyQuests = activeQuests.filter(q => q.type === 'weekly')

  // For non-premium users, show a preview of weekly quests (locked)
  const weeklyPreview: QuestDefinition[] = isPremium
    ? []
    : (() => {
        const weekString = getLocalWeekString()
        const seed = `${weekString}-preview`
        return seededShuffle(WEEKLY_QUESTS, seed).slice(0, 2)
      })()

  const today = getLocalDateString()
  const weekString = getLocalWeekString()

  const getIcon = (iconName: string): LucideIcon => {
    return ICON_MAP[iconName.toLowerCase()] || CheckCircle
  }

  const renderQuest = (quest: QuestDefinition, isLocked: boolean = false) => {
    const period = quest.type === 'daily' ? today : weekString
    const completed = !isLocked && isQuestCompleted(quest.id, period)
    const IconComponent = getIcon(quest.icon)

    return (
      <Card
        key={quest.id}
        className={cn(
          'py-0',
          completed && 'opacity-60',
          isLocked && 'cursor-pointer'
        )}
        onClick={isLocked ? () => navigate('/paywall') : undefined}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded',
                completed ? 'bg-success/20' : isLocked ? 'bg-muted/50' : 'bg-muted'
              )}
            >
              {completed ? (
                <Check size={18} className="text-success" />
              ) : isLocked ? (
                <Lock size={18} className="text-muted-foreground" />
              ) : (
                <IconComponent size={18} className="text-primary" />
              )}
            </div>

            {/* Quest Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    'font-medium truncate',
                    completed && 'line-through text-muted-foreground',
                    isLocked && 'text-muted-foreground'
                  )}
                >
                  {quest.title}
                </p>
                {isLocked && (
                  <span className="text-[10px] font-semibold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    Premium
                  </span>
                )}
              </div>
              <p
                className={cn(
                  'text-sm text-muted-foreground truncate',
                  completed && 'line-through'
                )}
              >
                {quest.description}
              </p>
            </div>

            {/* DP Reward */}
            <span
              className={cn(
                'text-sm font-mono font-bold shrink-0',
                completed ? 'text-success' : isLocked ? 'text-muted-foreground' : 'text-primary'
              )}
            >
              +{quest.dpReward} {LABELS.dp}
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Daily Protocol Orders */}
      <div>
        <h2 className="text-base font-bold uppercase tracking-wide mb-3">
          Protocol Orders
        </h2>
        <div className="space-y-3">
          {dailyQuests.map((quest, index) => (
            <div
              key={quest.id}
              className="animate-in fade-in slide-in-from-left-4 duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {renderQuest(quest)}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Protocol Orders */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Crown size={16} className="text-primary" />
          <h2 className="text-base font-bold uppercase tracking-wide">
            Weekly Orders
          </h2>
        </div>
        <div className="space-y-3">
          {isPremium ? (
            // Premium users see their actual weekly quests
            weeklyQuests.map((quest, index) => (
              <div
                key={quest.id}
                className="animate-in fade-in slide-in-from-left-4 duration-300"
                style={{ animationDelay: `${(dailyQuests.length + index) * 100}ms` }}
              >
                {renderQuest(quest)}
              </div>
            ))
          ) : (
            // Non-premium users see locked preview
            weeklyPreview.map((quest, index) => (
              <div
                key={quest.id}
                className="animate-in fade-in slide-in-from-left-4 duration-300"
                style={{ animationDelay: `${(dailyQuests.length + index) * 100}ms` }}
              >
                {renderQuest(quest, true)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
