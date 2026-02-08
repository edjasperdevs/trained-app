import { Card, CardContent } from '@/components/ui/card'
import { Check, X, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { PrescribedExercise } from '@/lib/database.types'
import type { Exercise } from '@/stores/workoutStore'

export interface PrescribedVsActualProps {
  prescribed: PrescribedExercise[]
  actual: Exercise[]
  className?: string
}

interface ComparisonRow {
  status: 'completed' | 'skipped' | 'added'
  name: string
  prescribed: PrescribedExercise | null
  actual: Exercise | null
}

function buildComparison(
  prescribed: PrescribedExercise[],
  actual: Exercise[]
): ComparisonRow[] {
  const rows: ComparisonRow[] = []
  const matchedActualIndexes = new Set<number>()

  // Match prescribed exercises to actual by name (case-insensitive, trimmed)
  for (const rx of prescribed) {
    const pName = rx.name.trim().toLowerCase()
    const actualIdx = actual.findIndex(
      (a, i) => !matchedActualIndexes.has(i) && a.name.trim().toLowerCase() === pName
    )

    if (actualIdx !== -1) {
      matchedActualIndexes.add(actualIdx)
      rows.push({
        status: 'completed',
        name: rx.name,
        prescribed: rx,
        actual: actual[actualIdx],
      })
    } else {
      rows.push({
        status: 'skipped',
        name: rx.name,
        prescribed: rx,
        actual: null,
      })
    }
  }

  // Added exercises: actual exercises not matched to any prescribed
  for (let i = 0; i < actual.length; i++) {
    if (!matchedActualIndexes.has(i)) {
      rows.push({
        status: 'added',
        name: actual[i].name,
        prescribed: null,
        actual: actual[i],
      })
    }
  }

  return rows
}

function formatActualSets(exercise: Exercise): string {
  const completedSets = exercise.sets.filter(s => s.completed)
  if (completedSets.length === 0) return 'No completed sets'

  const details = completedSets
    .map(s => `${s.reps}${s.weight ? `@${s.weight}` : ''}`)
    .join(', ')

  return `${completedSets.length} set${completedSets.length !== 1 ? 's' : ''} — ${details}`
}

function formatPrescribed(rx: PrescribedExercise): string {
  let text = `${rx.targetSets} x ${rx.targetReps}`
  if (rx.targetWeight) {
    text += ` @ ${rx.targetWeight}lbs`
  }
  return text
}

const statusConfig = {
  completed: {
    icon: Check,
    iconColor: 'text-success',
    bgColor: 'bg-success/10',
    label: null,
  },
  skipped: {
    icon: X,
    iconColor: 'text-warning',
    bgColor: 'bg-warning/10',
    label: 'Skipped',
  },
  added: {
    icon: Plus,
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    label: 'Added',
  },
} as const

export function PrescribedVsActual({ prescribed, actual, className }: PrescribedVsActualProps) {
  const rows = buildComparison(prescribed, actual)
  const completedCount = rows.filter(r => r.status === 'completed').length
  const prescribedCount = prescribed.length
  const adherencePercent = prescribedCount > 0
    ? Math.round((completedCount / prescribedCount) * 100)
    : 0

  return (
    <div className={cn('space-y-3', className)}>
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {completedCount} of {prescribedCount} exercises completed
        </p>
        <span className={cn(
          'text-sm font-digital font-bold px-2 py-0.5 rounded-full',
          adherencePercent >= 80 ? 'bg-success/20 text-success' :
          adherencePercent >= 50 ? 'bg-warning/20 text-warning' :
          'bg-destructive/20 text-destructive'
        )}>
          {adherencePercent}%
        </span>
      </div>

      {/* Exercise rows */}
      <Card className="py-0">
        <CardContent className="p-0 divide-y divide-border">
          {rows.map((row, i) => {
            const config = statusConfig[row.status]
            const Icon = config.icon
            return (
              <div key={`${row.status}-${row.name}-${i}`} className="p-3">
                <div className="flex items-start gap-2">
                  <div className={cn('rounded-full p-1 mt-0.5 shrink-0', config.bgColor)}>
                    <Icon size={12} className={config.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{row.name}</p>
                      {config.label && (
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded font-medium shrink-0',
                          row.status === 'skipped' ? 'bg-warning/20 text-warning' : 'bg-blue-400/20 text-blue-400'
                        )}>
                          {config.label}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 space-y-0.5">
                      {row.prescribed && (
                        <p className="text-xs text-muted-foreground">
                          <span className="text-muted-foreground/60">Prescribed:</span>{' '}
                          {formatPrescribed(row.prescribed)}
                        </p>
                      )}
                      {row.actual ? (
                        <p className="text-xs text-muted-foreground">
                          <span className="text-muted-foreground/60">Actual:</span>{' '}
                          {formatActualSets(row.actual)}
                        </p>
                      ) : row.status === 'skipped' ? (
                        <p className="text-xs text-muted-foreground">
                          <span className="text-muted-foreground/60">Actual:</span> —
                        </p>
                      ) : null}
                      {!row.prescribed && row.status === 'added' && (
                        <p className="text-xs text-muted-foreground">
                          <span className="text-muted-foreground/60">Prescribed:</span> —
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {rows.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No exercises to compare</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
