import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { PrescribedExercise } from '@/lib/database.types'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'

interface WorkoutBuilderProps {
  exercises: PrescribedExercise[]
  onChange: (exercises: PrescribedExercise[]) => void
  templateName?: string
  onNameChange?: (name: string) => void
  showNameField?: boolean
}

function createBlankExercise(): PrescribedExercise {
  return { name: '', targetSets: 3, targetReps: '8-12' }
}

export function WorkoutBuilder({
  exercises,
  onChange,
  templateName = '',
  onNameChange,
  showNameField = false,
}: WorkoutBuilderProps) {
  const updateExercise = (index: number, updates: Partial<PrescribedExercise>) => {
    const updated = exercises.map((ex, i) =>
      i === index ? { ...ex, ...updates } : ex
    )
    onChange(updated)
  }

  const removeExercise = (index: number) => {
    onChange(exercises.filter((_, i) => i !== index))
  }

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= exercises.length) return
    const updated = [...exercises]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    onChange(updated)
  }

  const addExercise = () => {
    onChange([...exercises, createBlankExercise()])
  }

  return (
    <div className="space-y-3">
      {showNameField && onNameChange && (
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Template Name</label>
          <Input
            value={templateName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g., Monday Push Day"
            className="font-semibold"
          />
        </div>
      )}

      {exercises.length === 0 ? (
        <Card className="py-0">
          <CardContent className="text-center py-6">
            <p className="text-muted-foreground mb-3">Add exercises to build your workout</p>
            <Button variant="ghost" onClick={addExercise}>
              <Plus size={16} className="mr-1" />
              Add Exercise
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {exercises.map((exercise, index) => (
            <Card key={index} className="py-0">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5 pt-1">
                    <button
                      type="button"
                      onClick={() => moveExercise(index, 'up')}
                      disabled={index === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      aria-label="Move up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveExercise(index, 'down')}
                      disabled={index === exercises.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      aria-label="Move down"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  {/* Exercise fields */}
                  <div className="flex-1 space-y-2">
                    <Input
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, { name: e.target.value })}
                      placeholder="Exercise name"
                      className="font-medium"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-0.5">Sets</label>
                        <Input
                          type="number"
                          value={exercise.targetSets}
                          onChange={(e) => updateExercise(index, { targetSets: parseInt(e.target.value) || 0 })}
                          min={1}
                          max={20}
                          className="font-digital"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-0.5">Reps</label>
                        <Input
                          value={exercise.targetReps}
                          onChange={(e) => updateExercise(index, { targetReps: e.target.value })}
                          placeholder="8-12"
                          className="font-digital"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-0.5">Weight</label>
                        <Input
                          type="number"
                          value={exercise.targetWeight ?? ''}
                          onChange={(e) => {
                            const val = e.target.value
                            updateExercise(index, {
                              targetWeight: val === '' ? undefined : parseFloat(val),
                            })
                          }}
                          placeholder="lbs"
                          className="font-digital"
                        />
                      </div>
                    </div>
                    <Input
                      value={exercise.notes ?? ''}
                      onChange={(e) => updateExercise(index, { notes: e.target.value || undefined })}
                      placeholder="Notes (optional)"
                      className="text-sm"
                    />
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removeExercise(index)}
                    className="text-muted-foreground hover:text-destructive transition-colors pt-1"
                    aria-label="Remove exercise"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      <Button
        variant="ghost"
        className="w-full"
        onClick={addExercise}
      >
        <Plus size={16} className="mr-1" />
        Add Exercise
      </Button>
    </div>
  )
}
