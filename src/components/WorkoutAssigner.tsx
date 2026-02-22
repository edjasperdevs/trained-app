import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { PrescribedExercise } from '@/lib/database.types'
import { useCoachTemplates } from '@/hooks/useCoachTemplates'
import { toast } from '@/stores'
import { confirmAction } from '@/lib/confirm'
import { Calendar, Dumbbell, FileText } from 'lucide-react'

interface WorkoutAssignerProps {
  exercises: PrescribedExercise[]
  templateId?: string
  templateName?: string
  clientId?: string
  clientName?: string
  clients?: { id: string; name: string }[]
  onAssigned: () => void
  onCancel: () => void
}

function getTomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export function WorkoutAssigner({
  exercises,
  templateId,
  templateName,
  clientId: initialClientId,
  clientName: initialClientName,
  clients = [],
  onAssigned,
  onCancel,
}: WorkoutAssignerProps) {
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || '')
  const [date, setDate] = useState(getTomorrow())
  const [notes, setNotes] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { checkExistingAssignment, assignWorkout } = useCoachTemplates()

  const selectedClientName = initialClientName
    || clients.find(c => c.id === selectedClientId)?.name
    || ''

  const handleAssign = async () => {
    if (!selectedClientId) {
      setErrorMsg('Please select a client')
      return
    }
    if (!date) {
      setErrorMsg('Please select a date')
      return
    }
    if (exercises.length === 0) {
      setErrorMsg('No exercises to assign')
      return
    }

    setIsAssigning(true)
    setErrorMsg(null)

    try {
      // Check for existing assignment on that date
      const existing = await checkExistingAssignment(selectedClientId, date)
      if (existing) {
        const confirmed = await confirmAction(
          `${selectedClientName || 'This client'} already has a workout assigned for ${date}. Replace it?`,
          'Replace Workout'
        )
        if (!confirmed) {
          setIsAssigning(false)
          return
        }
      }

      const result = await assignWorkout(
        selectedClientId,
        date,
        exercises,
        templateId,
        notes || undefined
      )

      if (result.error) {
        setErrorMsg(result.error)
        return
      }

      toast.success(`Workout assigned for ${date}`)
      onAssigned()
    } catch (err) {
      console.error('Error assigning workout:', err)
      setErrorMsg(err instanceof Error ? err.message : 'Failed to assign workout')
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground">
        ASSIGN WORKOUT{templateName ? `: ${templateName}` : ''}
      </h3>

      {/* Client selector (only if no clientId was provided) */}
      {!initialClientId && (
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Client</label>
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">No clients available</p>
          ) : (
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Date picker */}
      <div>
        <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
          <Calendar size={12} />
          Date
        </label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="font-digital"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
          <FileText size={12} />
          Notes (optional)
        </label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Focus on chest activation today"
        />
      </div>

      {/* Exercise summary */}
      <Card className="py-0">
        <CardContent className="p-3">
          <div className="flex items-center gap-1 mb-2">
            <Dumbbell size={14} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">
              {exercises.length} EXERCISE{exercises.length !== 1 ? 'S' : ''}
            </span>
          </div>
          <div className="space-y-1">
            {exercises.map((ex, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="truncate">{ex.name || 'Unnamed'}</span>
                <span className="text-muted-foreground ml-2 whitespace-nowrap">
                  {ex.targetSets} x {ex.targetReps}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error message */}
      {errorMsg && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleAssign}
          disabled={isAssigning || exercises.length === 0}
        >
          {isAssigning ? 'Assigning...' : 'Assign Workout'}
        </Button>
      </div>
    </div>
  )
}
