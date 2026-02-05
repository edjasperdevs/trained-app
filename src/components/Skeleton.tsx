interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-surface-elevated rounded ${className}`} />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-full" />
    </div>
  )
}

export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-surface pt-8 pb-6 px-5">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-40" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="px-5 space-y-6 mt-6">
        {/* Check-in banner */}
        <SkeletonCard />

        {/* Avatar & XP card */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-6">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>

        {/* Weekly summary */}
        <SkeletonCard />

        {/* Quests */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function WorkoutsSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-surface pt-8 pb-6 px-5">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Tab bar */}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>

        {/* Content cards */}
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}

export function MacrosSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-surface pt-8 pb-4 px-5">
        <Skeleton className="h-8 w-28 mb-4" />
        {/* Tabs */}
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Circular progress placeholder */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-lg p-4 flex flex-col items-center">
            <Skeleton className="h-28 w-28 rounded-full" />
            <Skeleton className="h-4 w-16 mt-2" />
          </div>
          <div className="bg-surface border border-border rounded-lg p-4 flex flex-col items-center">
            <Skeleton className="h-28 w-28 rounded-full" />
            <Skeleton className="h-4 w-16 mt-2" />
          </div>
        </div>

        {/* Macro bars */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>

        {/* Meal cards */}
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}

export function AchievementsSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-surface pt-8 pb-6 px-5">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        {/* Progress card */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-6">
        {/* Rarity breakdown */}
        <div className="grid grid-cols-4 gap-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-16 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>

        {/* Badge grid */}
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function AvatarSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-surface pt-8 pb-12 px-5">
        <Skeleton className="h-8 w-32 mx-auto mb-6" />
        {/* Large avatar placeholder */}
        <div className="flex justify-center">
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
      </div>

      <div className="px-5 space-y-6 -mt-4">
        {/* Stats card */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-3 w-10 mx-auto" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-16 mx-auto" />
              <Skeleton className="h-3 w-14 mx-auto" />
            </div>
          </div>
        </div>

        {/* Evolution info */}
        <SkeletonCard />

        {/* Character class */}
        <SkeletonCard />
      </div>
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-surface pt-8 pb-6 px-5">
        <Skeleton className="h-8 w-28" />
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Setting rows */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function OnboardingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col px-5 py-8">
      {/* Progress bar placeholder */}
      <div className="flex gap-1 mb-8 justify-center">
        <Skeleton className="h-1 w-8 rounded-full" />
        <Skeleton className="h-1 w-8 rounded-full" />
        <Skeleton className="h-1 w-8 rounded-full" />
        <Skeleton className="h-1 w-8 rounded-full" />
        <Skeleton className="h-1 w-8 rounded-full" />
      </div>

      {/* Centered content card */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <Skeleton className="h-10 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6 mx-auto" />
          <div className="space-y-3 pt-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
