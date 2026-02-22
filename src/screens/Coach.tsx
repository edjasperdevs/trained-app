import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { WeightChart, ClientMacroAdherence, ClientActivityFeed } from '@/components'
import { useAuthStore, toast } from '@/stores'
import { getSupabaseClient } from '@/lib/supabase'
import { useClientDetails } from '@/hooks/useClientDetails'
import { useClientRoster, ClientSummary } from '@/hooks/useClientRoster'
import { useCoachTemplates } from '@/hooks/useCoachTemplates'
import { useWeeklyCheckins, PendingCheckin } from '@/hooks/useWeeklyCheckins'
import { WorkoutBuilder } from '@/components/WorkoutBuilder'
import { WorkoutAssigner } from '@/components/WorkoutAssigner'
import { PrescribedVsActual } from '@/components/PrescribedVsActual'
import { analytics, trackEvent } from '@/lib/analytics'
import { confirmAction } from '@/lib/confirm'
import { getLocalDateString, getTimeAgo } from '@/lib/dateUtils'
import { cn } from '@/lib/cn'
import { getMockProfileByEmail, addMockClient, removeMockClient } from '@/lib/devSeed'
import { Search, ShieldCheck, Dumbbell, Plus, Pencil, Trash2, Send, ArrowLeft, ChevronDown, ChevronRight, ClipboardCheck, FileText } from 'lucide-react'
import { IntakeView } from '@/components/IntakeView'
import { countNewSubmissions } from '@/lib/intakeApi'
import { LABELS } from '@/design/constants'
import type { MacroTargets } from '@/hooks/useClientDetails'
import type { PrescribedExercise, WorkoutTemplate, AssignedWorkout, WeeklyCheckin } from '@/lib/database.types'
import type { Exercise } from '@/stores/workoutStore'

const devBypass = import.meta.env.VITE_DEV_BYPASS === 'true'

interface CompletedAssignment {
  log: {
    id: string
    date: string
    exercises: Exercise[]
    assignment_id: string
    completed: boolean
  }
  assignment: AssignedWorkout
}

type ClientDetailTab = 'overview' | 'progress' | 'activity' | 'programs' | 'checkins'
type DashboardView = 'clients' | 'templates' | 'checkins' | 'intake'
type TemplateMode = 'list' | 'create' | 'edit' | 'assign'

interface InviteRow {
  id: string
  email: string
  status: 'pending' | 'accepted' | 'expired'
  created_at: string
  expires_at: string
  accepted_at: string | null
}

function MacroEditor({
  clientId,
  currentTargets,
  coachId,
  onSaved
}: {
  clientId: string
  currentTargets: MacroTargets | null
  coachId: string
  onSaved: () => void
}) {
  const [calories, setCalories] = useState(currentTargets?.calories?.toString() || '')
  const [protein, setProtein] = useState(currentTargets?.protein?.toString() || '')
  const [carbs, setCarbs] = useState(currentTargets?.carbs?.toString() || '')
  const [fats, setFats] = useState(currentTargets?.fats?.toString() || '')
  const [isSaving, setIsSaving] = useState(false)

  // Sync fields when currentTargets changes (e.g. after refresh)
  useEffect(() => {
    setCalories(currentTargets?.calories?.toString() || '')
    setProtein(currentTargets?.protein?.toString() || '')
    setCarbs(currentTargets?.carbs?.toString() || '')
    setFats(currentTargets?.fats?.toString() || '')
  }, [currentTargets?.calories, currentTargets?.protein, currentTargets?.carbs, currentTargets?.fats])

  const handleSave = async () => {
    // Validate all 4 fields are non-empty and valid positive numbers
    const cals = Number(calories)
    const prot = Number(protein)
    const carb = Number(carbs)
    const fat = Number(fats)

    if (!calories || !protein || !carbs || !fats || isNaN(cals) || isNaN(prot) || isNaN(carb) || isNaN(fat)) {
      toast.error('Please fill in all macro fields with valid numbers')
      return
    }

    if (cals <= 0 || prot <= 0 || carb < 0 || fat <= 0) {
      toast.error('Macro values must be positive numbers')
      return
    }

    setIsSaving(true)

    try {
      if (devBypass) {
        toast.success('Macros updated (dev mode)')
        onSaved()
        return
      }

      const client = getSupabaseClient()
      const { error } = await client
        .from('macro_targets')
        .upsert({
          user_id: clientId,
          calories: cals,
          protein: prot,
          carbs: carb,
          fats: fat,
          set_by: 'coach',
          set_by_coach_id: coachId,
          activity_level: 'moderate',
        }, { onConflict: 'user_id' })

      if (error) {
        toast.error('Failed to set macros')
        return
      }

      toast.success('Macros updated')
      trackEvent('Coach Set Macros', { clientId })
      onSaved()
    } catch (err) {
      console.error('Error setting macros:', err)
      toast.error('Failed to set macros')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRevert = async () => {
    if (!await confirmAction('Release macro targets back to the client? They will be able to recalculate their own macros.', 'Release Targets')) {
      return
    }

    setIsSaving(true)

    try {
      if (devBypass) {
        toast.success('Macros released (dev mode)')
        onSaved()
        return
      }

      const client = getSupabaseClient()
      const { error } = await client
        .from('macro_targets')
        .update({ set_by: 'self', set_by_coach_id: null })
        .eq('user_id', clientId)

      if (error) {
        toast.error('Failed to release macros')
        return
      }

      toast.success('Client can now manage their own macros')
      onSaved()
    } catch (err) {
      console.error('Error releasing macros:', err)
      toast.error('Failed to release macros')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="py-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground">SET MACRO TARGETS</h3>
          {currentTargets?.set_by === 'coach' && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <ShieldCheck size={12} />
              Currently set by {LABELS.coach.toLowerCase()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Calories</label>
            <Input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="2000"
              min={800}
              max={8000}
              className="font-digital"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Protein (g)</label>
            <Input
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="150"
              min={50}
              max={500}
              className="font-digital"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Carbs (g)</label>
            <Input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="200"
              min={0}
              max={1000}
              className="font-digital"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Fats (g)</label>
            <Input
              type="number"
              value={fats}
              onChange={(e) => setFats(e.target.value)}
              placeholder="65"
              min={20}
              max={300}
              className="font-digital"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          className="w-full"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Set Macros'}
        </Button>

        {currentTargets?.set_by === 'coach' && (
          <Button
            variant="ghost"
            onClick={handleRevert}
            className="w-full mt-2"
            disabled={isSaving}
          >
            Release to Client
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function Coach() {
  const user = useAuthStore((state) => state.user)
  const {
    clients,
    totalCount,
    page,
    search,
    isLoading,
    error,
    totalPages,
    setPage,
    setSearch,
    refresh,
  } = useClientRoster()

  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null)
  const [activeTab, setActiveTab] = useState<ClientDetailTab>('overview')
  const [showAddClient, setShowAddClient] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [inviteMessage, setInviteMessage] = useState('')
  const [invites, setInvites] = useState<InviteRow[]>([])

  // Check-ins state
  const [selectedCheckin, setSelectedCheckin] = useState<PendingCheckin | null>(null)
  const [reviewResponse, setReviewResponse] = useState('')
  const [isReviewing, setIsReviewing] = useState(false)
  const [clientCheckinsList, setClientCheckinsList] = useState<WeeklyCheckin[]>([])
  const [clientCheckinsLoading, setClientCheckinsLoading] = useState(false)
  const [expandedCheckinId, setExpandedCheckinId] = useState<string | null>(null)

  const {
    pendingCheckins,
    fetchPendingCheckins,
    fetchClientCheckins,
    submitReview,
    isLoading: isCheckinsLoading,
  } = useWeeklyCheckins()

  // Templates / Programs state
  const [dashboardView, setDashboardView] = useState<DashboardView>('clients')
  const [templateMode, setTemplateMode] = useState<TemplateMode>('list')
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null)
  const [builderExercises, setBuilderExercises] = useState<PrescribedExercise[]>([])
  const [builderName, setBuilderName] = useState('')
  const [assigningTemplate, setAssigningTemplate] = useState<WorkoutTemplate | null>(null)
  // Client detail programs state
  const [clientAssignments, setClientAssignments] = useState<AssignedWorkout[]>([])
  const [showClientAssigner, setShowClientAssigner] = useState(false)
  const [clientInlineExercises, setClientInlineExercises] = useState<PrescribedExercise[]>([])
  const [showInlineBuilder, setShowInlineBuilder] = useState(false)
  const [completedAssignments, setCompletedAssignments] = useState<CompletedAssignment[]>([])
  const [completedLoading, setCompletedLoading] = useState(false)
  const [expandedCompletedId, setExpandedCompletedId] = useState<string | null>(null)

  // Intake badge count
  const [newIntakeCount, setNewIntakeCount] = useState(0)

  useEffect(() => {
    countNewSubmissions().then(setNewIntakeCount)
  }, [])

  useEffect(() => {
    if (dashboardView !== 'intake') return
    // Re-fetch when leaving intake tab (submission may have been reviewed)
    return () => { countNewSubmissions().then(setNewIntakeCount) }
  }, [dashboardView])

  const {
    templates,
    isLoading: isTemplatesLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    fetchClientAssignments,
    deleteAssignment,
  } = useCoachTemplates()

  const {
    weightData: clientWeightData,
    macroData: clientMacroData,
    activityData: clientActivityData,
    isLoading: isClientDetailsLoading,
    error: clientDetailsError,
    refresh: refreshClientDetails
  } = useClientDetails(selectedClient?.client_id || null)

  // Reset tab when selecting a new client
  useEffect(() => {
    if (selectedClient) {
      setActiveTab('overview')
      setShowClientAssigner(false)
      setShowInlineBuilder(false)
      setClientInlineExercises([])
      setCompletedAssignments([])
      setExpandedCompletedId(null)
    }
  }, [selectedClient?.client_id])

  // Fetch pending check-ins when switching to checkins dashboard view
  useEffect(() => {
    if (dashboardView === 'checkins') {
      fetchPendingCheckins()
    }
  }, [dashboardView, fetchPendingCheckins])

  // Fetch client check-ins when Check-ins tab is active in client detail
  useEffect(() => {
    if (activeTab === 'checkins' && selectedClient?.client_id) {
      let cancelled = false
      setClientCheckinsLoading(true)
      fetchClientCheckins(selectedClient.client_id)
        .then(checkins => {
          if (!cancelled) setClientCheckinsList(checkins)
        })
        .finally(() => { if (!cancelled) setClientCheckinsLoading(false) })
      return () => { cancelled = true }
    }
  }, [activeTab, selectedClient?.client_id, fetchClientCheckins])

  // Load client assignments when Programs tab is active
  useEffect(() => {
    if (activeTab === 'programs' && selectedClient?.client_id) {
      let cancelled = false
      const today = new Date()
      const past30 = new Date(today)
      past30.setDate(past30.getDate() - 30)
      const future30 = new Date(today)
      future30.setDate(future30.getDate() + 30)

      fetchClientAssignments(
        selectedClient.client_id,
        past30.toISOString().split('T')[0],
        future30.toISOString().split('T')[0]
      ).then(assignments => {
        if (!cancelled) setClientAssignments(assignments)
      })
      return () => { cancelled = true }
    }
  }, [activeTab, selectedClient?.client_id, fetchClientAssignments])

  // Load completed assigned workouts when Programs tab is active
  useEffect(() => {
    if (activeTab !== 'programs' || !selectedClient?.client_id) return
    let cancelled = false

    const fetchCompletedAssignments = async (clientId: string) => {
      setCompletedLoading(true)
      try {
        if (devBypass) {
          // Mock: simulate one completed workout matching the mock assignment
          const mockCompleted: CompletedAssignment[] = clientAssignments
            .filter(a => a.date <= getLocalDateString())
            .slice(0, 1)
            .map(a => ({
              log: {
                id: `log-${a.id}`,
                date: a.date,
                exercises: a.exercises.map((ex, i) => ({
                  id: `ex-${i}`,
                  name: ex.name,
                  targetSets: ex.targetSets,
                  targetReps: ex.targetReps,
                  sets: Array.from({ length: ex.targetSets }, (_, si) => ({
                    weight: ex.targetWeight || (100 + si * 5),
                    reps: parseInt(ex.targetReps) || 10,
                    completed: si < ex.targetSets - (i === 1 ? 1 : 0), // Skip last set of 2nd exercise
                  })),
                  notes: ex.notes,
                })),
                assignment_id: a.id,
                completed: true,
              },
              assignment: a,
            }))
          // Add a mock "added" exercise to the first completed
          if (mockCompleted.length > 0) {
            mockCompleted[0].log.exercises.push({
              id: 'ex-added',
              name: 'Face Pulls',
              targetSets: 3,
              targetReps: '15-20',
              sets: [
                { weight: 30, reps: 20, completed: true },
                { weight: 30, reps: 18, completed: true },
                { weight: 30, reps: 15, completed: true },
              ],
            })
          }
          if (!cancelled) setCompletedAssignments(mockCompleted)
          return
        }

        const client = getSupabaseClient()

        // Get assigned workouts for this client
        const { data: assignments } = await client
          .from('assigned_workouts')
          .select('id, date, exercises, notes, template_id, coach_id, client_id, created_at, updated_at')
          .eq('client_id', clientId)
          .order('date', { ascending: false })
          .limit(20)

        if (cancelled) return

        const assignmentIds = assignments?.map(a => a.id) || []
        if (assignmentIds.length === 0) {
          if (!cancelled) setCompletedAssignments([])
          return
        }

        // Get completed workout logs linked to these assignments
        const { data: logs } = await client
          .from('workout_logs')
          .select('id, date, exercises, assignment_id, completed')
          .in('assignment_id', assignmentIds)
          .eq('completed', true)

        if (cancelled) return

        if (!logs || logs.length === 0) {
          setCompletedAssignments([])
          return
        }

        // Pair each log with its assignment
        const paired: CompletedAssignment[] = logs
          .map(log => {
            const assignment = assignments?.find(a => a.id === log.assignment_id)
            if (!assignment) return null
            return {
              log: {
                id: log.id,
                date: log.date,
                exercises: (log.exercises as unknown as Exercise[]) || [],
                assignment_id: log.assignment_id!,
                completed: log.completed,
              },
              assignment: {
                id: assignment.id,
                created_at: assignment.created_at,
                updated_at: assignment.updated_at,
                coach_id: assignment.coach_id,
                client_id: assignment.client_id,
                template_id: assignment.template_id,
                date: assignment.date,
                exercises: (assignment.exercises as unknown as PrescribedExercise[]) || [],
                notes: assignment.notes,
              },
            }
          })
          .filter((p): p is CompletedAssignment => p !== null)
          .sort((a, b) => b.log.date.localeCompare(a.log.date))

        if (!cancelled) setCompletedAssignments(paired)
      } catch (err) {
        console.error('Error fetching completed assignments:', err)
        if (!cancelled) setCompletedAssignments([])
      } finally {
        if (!cancelled) setCompletedLoading(false)
      }
    }

    fetchCompletedAssignments(selectedClient.client_id)
    return () => { cancelled = true }
  }, [activeTab, selectedClient?.client_id, clientAssignments])

  useEffect(() => {
    fetchInvites()
  }, [])

  useEffect(() => {
    analytics.coachDashboardViewed()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      analytics.clientViewed()
    }
  }, [selectedClient])

  const fetchInvites = async () => {
    try {
      if (devBypass) {
        setInvites([])
        return
      }

      const client = getSupabaseClient()

      const { data, error } = await client
        .from('invites')
        .select('id, email, status, created_at, expires_at, accepted_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching invites:', error)
        return
      }

      // Compute display status: if status is 'pending' but expires_at is past, display as 'expired'
      const processedInvites = (data || []).map((inv) => ({
        ...inv,
        status: (inv.status === 'pending' && new Date(inv.expires_at) < new Date()
          ? 'expired'
          : inv.status) as InviteRow['status'],
      }))

      setInvites(processedInvites)
    } catch (err) {
      console.error('Error fetching invites:', err)
    }
  }

  const handleInviteClient = async (emailOverride?: string) => {
    const emailToSend = emailOverride || inviteEmail
    if (!emailToSend.trim()) return

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailToSend)) {
      setInviteStatus('error')
      setInviteMessage('Please enter a valid email address.')
      return
    }

    setInviteStatus('loading')
    setInviteMessage('')

    try {
      if (devBypass) {
        // Mock Edge Function response for dev bypass
        await new Promise(r => setTimeout(r, 500))

        const profile = getMockProfileByEmail(emailToSend.toLowerCase())
        if (profile) {
          // Simulate 'added_directly' -- existing user
          const existing = clients.find(c => c.client_id === profile.id)
          if (existing) {
            setInviteStatus('error')
            setInviteMessage('This user is already your client.')
            return
          }

          const added = addMockClient(profile.id)
          if (!added) {
            setInviteStatus('error')
            setInviteMessage('Failed to send invite.')
            return
          }

          setInviteStatus('success')
          setInviteMessage('User already had an account -- added as client!')
          toast.success('Client added!')
          setInviteEmail('')
          refresh()
        } else {
          // Simulate 'invite_sent' -- new user
          setInviteStatus('success')
          setInviteMessage('Invite sent!')
          toast.success('Invite sent!')
          setInviteEmail('')
        }

        setTimeout(() => {
          setShowAddClient(false)
          setInviteStatus('idle')
          setInviteMessage('')
        }, 1500)
        return
      }

      const client = getSupabaseClient()

      const { data, error } = await client.functions.invoke('send-invite', {
        body: { email: emailToSend.toLowerCase() },
      })

      if (error) {
        // Edge Function network/relay error
        setInviteStatus('error')
        if (error.message?.includes('FunctionsRelayError') || error.message?.includes('non-2xx')) {
          setInviteMessage('Invite service is unavailable. Please try again later.')
        } else if (error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
          setInviteMessage('Network error - check your connection.')
        } else {
          setInviteMessage(error.message || 'Failed to send invite. Please try again.')
        }
        return
      }

      // Parse Edge Function response
      if (data?.error) {
        setInviteStatus('error')
        setInviteMessage(data.error)
        return
      }

      if (data?.action === 'added_directly') {
        setInviteStatus('success')
        setInviteMessage('User already had an account -- added as client!')
        toast.success('Client added!')
        setInviteEmail('')
        refresh()
        fetchInvites()
      } else if (data?.action === 'invite_sent') {
        setInviteStatus('success')
        setInviteMessage('Invite sent!')
        toast.success('Invite sent!')
        setInviteEmail('')
        fetchInvites()
      } else {
        setInviteStatus('success')
        setInviteMessage('Invite sent!')
        toast.success('Invite sent!')
        setInviteEmail('')
        fetchInvites()
      }

      setTimeout(() => {
        setShowAddClient(false)
        setInviteStatus('idle')
        setInviteMessage('')
      }, 1500)

    } catch (err) {
      console.error('Error sending invite:', err)
      setInviteStatus('error')
      if (err instanceof Error && err.message.includes('network')) {
        setInviteMessage('Network error - check your connection.')
      } else {
        setInviteMessage('Failed to send invite. Please try again.')
      }
    }
  }

  const handleRemoveClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to remove this client?')) return

    try {
      if (devBypass) {
        removeMockClient(clientId)
        toast.success('Client removed')
        setSelectedClient(null)
        refresh()
        return
      }

      if (!user?.id) return
      const client = getSupabaseClient()

      const { error } = await client
        .from('coach_clients')
        .delete()
        .eq('coach_id', user.id)
        .eq('client_id', clientId)

      if (error) throw error

      toast.success('Client removed')
      setSelectedClient(null)
      refresh()
    } catch (err) {
      console.error('Error removing client:', err)
      if (err instanceof Error && err.message.includes('network')) {
        toast.error('Network error - check your connection')
      } else {
        toast.error('Failed to remove client')
      }
    }
  }

  const getStatusColor = (client: ClientSummary) => {
    if (!client.onboarding_complete) return 'text-muted-foreground'

    const daysSinceCheckIn = client.last_check_in_date
      ? Math.floor((Date.now() - new Date(client.last_check_in_date).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    if (daysSinceCheckIn <= 1) return 'text-success'
    if (daysSinceCheckIn <= 3) return 'text-warning'
    return 'text-destructive'
  }

  const getStatusEmoji = (client: ClientSummary) => {
    if (!client.onboarding_complete) return '⏳'

    const daysSinceCheckIn = client.last_check_in_date
      ? Math.floor((Date.now() - new Date(client.last_check_in_date).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    if (daysSinceCheckIn <= 1) return '🟢'
    if (daysSinceCheckIn <= 3) return '🟡'
    return '🔴'
  }

  // getTimeAgo imported from @/lib/dateUtils

  // Template management helpers
  const handleNewTemplate = () => {
    setBuilderName('')
    setBuilderExercises([])
    setEditingTemplate(null)
    setTemplateMode('create')
  }

  const handleEditTemplate = (template: WorkoutTemplate) => {
    setBuilderName(template.name)
    setBuilderExercises([...template.exercises])
    setEditingTemplate(template)
    setTemplateMode('edit')
  }

  const handleSaveTemplate = async () => {
    if (!builderName.trim()) {
      toast.error('Please enter a template name')
      return
    }
    if (builderExercises.length === 0) {
      toast.error('Please add at least one exercise')
      return
    }

    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, {
        name: builderName,
        exercises: builderExercises,
      })
      toast.success('Template updated')
    } else {
      await createTemplate(builderName, builderExercises)
      toast.success('Template created')
    }

    setTemplateMode('list')
    setEditingTemplate(null)
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!await confirmAction('Delete this template? This cannot be undone.', 'Delete Template')) return
    await deleteTemplate(id)
    toast.success('Template deleted')
  }

  const handleQuickAssign = (template: WorkoutTemplate) => {
    setAssigningTemplate(template)
    setTemplateMode('assign')
  }

  const handleDeleteAssignment = async (id: string) => {
    if (!await confirmAction('Remove this assigned workout?', 'Remove Workout')) return
    await deleteAssignment(id)
    // Refresh assignments
    if (selectedClient?.client_id) {
      const today = new Date()
      const past30 = new Date(today)
      past30.setDate(past30.getDate() - 30)
      const future30 = new Date(today)
      future30.setDate(future30.getDate() + 30)
      const updated = await fetchClientAssignments(
        selectedClient.client_id,
        past30.toISOString().split('T')[0],
        future30.toISOString().split('T')[0]
      )
      setClientAssignments(updated)
    }
    toast.success('Assignment removed')
  }

  // Check-in review handler
  const handleSubmitReview = async () => {
    if (!selectedCheckin || !reviewResponse.trim()) {
      toast.error('Please write a response before submitting')
      return
    }

    setIsReviewing(true)
    try {
      const { error: reviewError } = await submitReview(selectedCheckin.id, reviewResponse.trim())
      if (reviewError) {
        toast.error(reviewError)
        return
      }
      toast.success('Review submitted')
      setSelectedCheckin(null)
      setReviewResponse('')
      fetchPendingCheckins()
    } catch (err) {
      console.error('Error submitting review:', err)
      toast.error('Failed to submit review')
    } finally {
      setIsReviewing(false)
    }
  }

  // Check-in field sections for display
  const getCheckinSections = (checkin: WeeklyCheckin | PendingCheckin) => {
    const sections = [
      {
        title: 'Nutrition',
        fields: [
          { label: 'Water Intake', value: checkin.water_intake },
          { label: 'Caffeine Intake', value: checkin.caffeine_intake },
          { label: 'Hunger Level', value: checkin.hunger_level !== null ? `${checkin.hunger_level}/5` : null },
          { label: 'Slip-ups', value: checkin.slip_ups },
          { label: 'Last Refeed', value: checkin.refeed_date },
          { label: 'Digestion', value: checkin.digestion },
        ],
      },
      {
        title: 'Training',
        fields: [
          { label: 'Progress', value: checkin.training_progress },
          { label: 'Feedback', value: checkin.training_feedback },
          { label: 'Recovery / Soreness', value: checkin.recovery_soreness },
        ],
      },
      {
        title: 'Lifestyle',
        fields: [
          { label: 'Sleep Quality', value: checkin.sleep_quality !== null ? `${checkin.sleep_quality}/5` : null },
          { label: 'Sleep Hours', value: checkin.sleep_hours !== null ? `${checkin.sleep_hours} hours` : null },
          { label: 'Stress Level', value: checkin.stress_level !== null ? `${checkin.stress_level}/5` : null },
          { label: 'Stressors', value: checkin.stressors },
          { label: 'Mental Health', value: checkin.mental_health },
        ],
      },
      {
        title: 'Health',
        fields: [
          { label: 'Injuries', value: checkin.injuries },
          { label: 'Cycle Status', value: checkin.cycle_status },
          { label: 'Side Effects', value: checkin.side_effects },
          { label: 'Last Bloodwork', value: checkin.bloodwork_date },
        ],
      },
      {
        title: 'Open Feedback',
        fields: [
          { label: 'Additional Notes', value: checkin.open_feedback },
        ],
      },
    ]

    // Filter out sections where all fields are empty
    return sections
      .map(section => ({
        ...section,
        fields: section.fields.filter(f => f.value !== null && f.value !== undefined && f.value !== ''),
      }))
      .filter(section => section.fields.length > 0)
  }

  // Filter invites to show only non-accepted (pending + expired)
  const visibleInvites = invites.filter(inv => inv.status !== 'accepted')

  if (isLoading && clients.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl block mb-4 animate-pulse">📋</span>
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    )
  }

  if (error && clients.length === 0 && !search.trim()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <Card className="py-0">
          <CardContent className="text-center p-4">
            <span className="text-4xl block mb-4">⚠️</span>
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={refresh}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-card pt-8 pb-6 px-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Coach Dashboard</h1>
            <p className="text-muted-foreground">
              {dashboardView === 'clients'
                ? `${totalCount} client${totalCount !== 1 ? 's' : ''}`
                : dashboardView === 'templates'
                ? `${templates.length} template${templates.length !== 1 ? 's' : ''}`
                : dashboardView === 'intake'
                ? newIntakeCount > 0
                  ? `${newIntakeCount} new submission${newIntakeCount !== 1 ? 's' : ''}`
                  : 'Intake submissions'
                : `${pendingCheckins.length} pending`
              }
            </p>
          </div>
          {dashboardView === 'clients' ? (
            <Button onClick={() => setShowAddClient(true)}>
              + Invite Client
            </Button>
          ) : dashboardView === 'templates' && templateMode === 'list' ? (
            <Button onClick={handleNewTemplate}>
              <Plus size={16} className="mr-1" />
              New Template
            </Button>
          ) : null}
        </div>

        {/* View Toggle */}
        <div className="flex mt-4 bg-background rounded-lg p-1">
          <button
            onClick={() => { setDashboardView('clients'); setTemplateMode('list') }}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
              dashboardView === 'clients'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Clients
          </button>
          <button
            onClick={() => setDashboardView('templates')}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1',
              dashboardView === 'templates'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Dumbbell size={14} />
            Templates
          </button>
          <button
            onClick={() => { setDashboardView('checkins'); setSelectedCheckin(null) }}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1',
              dashboardView === 'checkins'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ClipboardCheck size={14} />
            Check-ins
          </button>
          <button
            onClick={() => setDashboardView('intake')}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1',
              dashboardView === 'intake'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileText size={14} />
            Intake
            {newIntakeCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-semibold text-white bg-red-500 rounded-full">
                {newIntakeCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Input (clients view only) */}
        {dashboardView === 'clients' && (totalCount > 0 || search.trim()) && (
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="pl-9"
            />
          </div>
        )}
      </div>

      <div className="px-5 py-6 space-y-4">
        {/* Templates View */}
        {dashboardView === 'templates' && (
          <>
            {templateMode === 'list' && (
              <>
                {isTemplatesLoading ? (
                  <div className="text-center py-8">
                    <span className="text-2xl animate-pulse">...</span>
                    <p className="text-sm text-muted-foreground mt-1">Loading templates...</p>
                  </div>
                ) : templates.length === 0 ? (
                  <Card className="py-0">
                    <CardContent className="text-center py-8">
                      <Dumbbell size={40} className="mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">No templates yet</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create workout templates to quickly assign to clients
                      </p>
                      <Button onClick={handleNewTemplate}>
                        <Plus size={16} className="mr-1" />
                        Create Template
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <Card key={template.id} className="py-0">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{template.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                                {' '}&middot;{' '}
                                Updated {new Date(template.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleQuickAssign(template)}
                                title="Quick Assign"
                              >
                                <Send size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditTemplate(template)}
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="text-destructive hover:text-destructive"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}

            {(templateMode === 'create' || templateMode === 'edit') && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setTemplateMode('list'); setEditingTemplate(null) }}
                  >
                    <ArrowLeft size={16} className="mr-1" />
                    Back
                  </Button>
                  <h2 className="text-sm font-semibold text-muted-foreground">
                    {templateMode === 'create' ? 'NEW TEMPLATE' : 'EDIT TEMPLATE'}
                  </h2>
                </div>

                <WorkoutBuilder
                  exercises={builderExercises}
                  onChange={setBuilderExercises}
                  templateName={builderName}
                  onNameChange={setBuilderName}
                  showNameField
                />

                <Button
                  className="w-full"
                  onClick={handleSaveTemplate}
                  disabled={!builderName.trim() || builderExercises.length === 0}
                >
                  {templateMode === 'create' ? 'Save Template' : 'Update Template'}
                </Button>
              </div>
            )}

            {templateMode === 'assign' && assigningTemplate && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setTemplateMode('list'); setAssigningTemplate(null) }}
                  >
                    <ArrowLeft size={16} className="mr-1" />
                    Back
                  </Button>
                </div>

                <WorkoutAssigner
                  exercises={assigningTemplate.exercises}
                  templateId={assigningTemplate.id}
                  templateName={assigningTemplate.name}
                  clients={clients
                    .filter(c => c.client_id && c.onboarding_complete)
                    .map(c => ({
                      id: c.client_id!,
                      name: c.username || c.email?.split('@')[0] || 'Unknown',
                    }))}
                  onAssigned={() => {
                    setTemplateMode('list')
                    setAssigningTemplate(null)
                    toast.success('Workout assigned!')
                  }}
                  onCancel={() => {
                    setTemplateMode('list')
                    setAssigningTemplate(null)
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* Check-ins View */}
        {dashboardView === 'checkins' && (
          <>
            {selectedCheckin ? (
              /* Review view for a single check-in */
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSelectedCheckin(null); setReviewResponse('') }}
                  >
                    <ArrowLeft size={16} className="mr-1" />
                    Back
                  </Button>
                  <h2 className="text-sm font-semibold text-muted-foreground">REVIEW CHECK-IN</h2>
                </div>

                {/* Client name + week header */}
                <Card className="py-0">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-bold">
                      {selectedCheckin.client_username || selectedCheckin.client_email?.split('@')[0] || 'Unknown'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Week of {new Date(selectedCheckin.week_of + 'T00:00:00').toLocaleDateString()}
                      {' '}&middot;{' '}
                      Submitted {getTimeAgo(selectedCheckin.created_at)}
                    </p>
                  </CardContent>
                </Card>

                {/* Auto-populated data summary */}
                <Card className="py-0">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">APP DATA (AUTO)</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Current Weight</p>
                        <p className="font-digital text-lg">
                          {selectedCheckin.auto_weight_current !== null
                            ? `${selectedCheckin.auto_weight_current} lbs`
                            : '--'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Weekly Avg</p>
                        <p className="font-digital text-lg">
                          {selectedCheckin.auto_weight_weekly_avg !== null
                            ? `${selectedCheckin.auto_weight_weekly_avg} lbs`
                            : '--'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Weight Change</p>
                        <p className={cn(
                          'font-digital text-lg',
                          selectedCheckin.auto_weight_change !== null && selectedCheckin.auto_weight_change < 0
                            ? 'text-success'
                            : selectedCheckin.auto_weight_change !== null && selectedCheckin.auto_weight_change > 0
                            ? 'text-destructive'
                            : ''
                        )}>
                          {selectedCheckin.auto_weight_change !== null
                            ? `${selectedCheckin.auto_weight_change > 0 ? '+' : ''}${selectedCheckin.auto_weight_change} lbs`
                            : '--'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Macro Hit Rate</p>
                        <p className="font-digital text-lg">
                          {selectedCheckin.auto_macro_hit_rate !== null
                            ? `${selectedCheckin.auto_macro_hit_rate}%`
                            : '--'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Workouts</p>
                        <p className="font-digital text-lg">
                          {selectedCheckin.auto_workouts_completed !== null
                            ? selectedCheckin.auto_workouts_completed
                            : '--'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Steps (avg)</p>
                        <p className="font-digital text-lg text-muted-foreground">
                          {selectedCheckin.auto_step_avg !== null
                            ? selectedCheckin.auto_step_avg.toLocaleString()
                            : 'Not tracked'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Client-submitted fields by section */}
                {getCheckinSections(selectedCheckin).map((section) => (
                  <Card key={section.title} className="py-0">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                        {section.title.toUpperCase()}
                      </h3>
                      <div className="space-y-3">
                        {section.fields.map((field) => (
                          <div key={field.label}>
                            <p className="text-xs text-muted-foreground mb-0.5">{field.label}</p>
                            <p className="text-sm">{field.value}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Coach response textarea */}
                <Card className="py-0">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">YOUR RESPONSE</h3>
                    <Textarea
                      value={reviewResponse}
                      onChange={(e) => setReviewResponse(e.target.value)}
                      placeholder="Write your feedback, adjustments, and encouragement..."
                      className="mb-3 min-h-[120px]"
                    />
                    <Button
                      className="w-full"
                      onClick={handleSubmitReview}
                      disabled={isReviewing || !reviewResponse.trim()}
                    >
                      {isReviewing ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Pending check-ins list */
              <>
                {isCheckinsLoading ? (
                  <div className="text-center py-8">
                    <span className="text-2xl animate-pulse">...</span>
                    <p className="text-sm text-muted-foreground mt-1">Loading check-ins...</p>
                  </div>
                ) : pendingCheckins.length === 0 ? (
                  <Card className="py-0">
                    <CardContent className="text-center py-8">
                      <ClipboardCheck size={40} className="mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">No pending check-ins</p>
                      <p className="text-sm text-muted-foreground">
                        You're all caught up! Check-ins will appear here when clients submit them.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {pendingCheckins.map((checkin) => (
                      <Card
                        key={checkin.id}
                        className="py-0 cursor-pointer hover:bg-card/80 transition-colors"
                        onClick={() => { setSelectedCheckin(checkin); setReviewResponse('') }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <ClipboardCheck size={20} className="text-secondary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">
                                {checkin.client_username || checkin.client_email?.split('@')[0] || 'Unknown'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Week of {new Date(checkin.week_of + 'T00:00:00').toLocaleDateString()}
                                {' '}&middot;{' '}
                                {getTimeAgo(checkin.created_at)}
                              </p>
                            </div>
                            <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full font-medium shrink-0">
                              Pending
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Intake View */}
        {dashboardView === 'intake' && (
          <IntakeView />
        )}

        {/* Clients View */}
        {dashboardView === 'clients' && (<>
        {/* Quick Stats -- only show when all clients fit on one page */}
        {totalPages <= 1 && clients.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="py-0 text-center">
              <CardContent className="p-3">
                <p className="text-2xl font-bold font-digital text-success">
                  {clients.filter(c => {
                    const days = c.last_check_in_date
                      ? Math.floor((Date.now() - new Date(c.last_check_in_date).getTime()) / (1000 * 60 * 60 * 24))
                      : 999
                    return days <= 1
                  }).length}
                </p>
                <p className="text-xs text-muted-foreground">Active Today</p>
              </CardContent>
            </Card>
            <Card className="py-0 text-center">
              <CardContent className="p-3">
                <p className="text-2xl font-bold font-digital text-warning">
                  {clients.filter(c => {
                    const days = c.last_check_in_date
                      ? Math.floor((Date.now() - new Date(c.last_check_in_date).getTime()) / (1000 * 60 * 60 * 24))
                      : 999
                    return days > 1 && days <= 3
                  }).length}
                </p>
                <p className="text-xs text-muted-foreground">Need Check-in</p>
              </CardContent>
            </Card>
            <Card className="py-0 text-center">
              <CardContent className="p-3">
                <p className="text-2xl font-bold font-digital text-destructive">
                  {clients.filter(c => {
                    const days = c.last_check_in_date
                      ? Math.floor((Date.now() - new Date(c.last_check_in_date).getTime()) / (1000 * 60 * 60 * 24))
                      : 999
                    return days > 3
                  }).length}
                </p>
                <p className="text-xs text-muted-foreground">Falling Off</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pending Invites */}
        {visibleInvites.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-sm font-semibold text-muted-foreground">PENDING INVITES</h2>
              <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full font-medium">
                {visibleInvites.length}
              </span>
            </div>
            <div className="space-y-2" data-sentry-mask>
              {visibleInvites.map((invite) => (
                <Card key={invite.id} className="py-0">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{invite.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            invite.status === 'pending'
                              ? 'bg-warning/20 text-warning'
                              : 'bg-muted text-muted-foreground'
                          )}>
                            {invite.status === 'pending' ? 'Pending' : 'Expired'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Sent {getTimeAgo(invite.created_at)}
                          </span>
                        </div>
                      </div>
                      {invite.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => handleInviteClient(invite.email)}
                          disabled={inviteStatus === 'loading'}
                        >
                          Resend
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Client List */}
        {clients.length === 0 ? (
          search.trim() ? (
            <Card className="py-0">
              <CardContent className="text-center py-8">
                <span className="text-4xl block mb-4">🔍</span>
                <p className="text-muted-foreground mb-2">No clients match your search</p>
                <p className="text-sm text-muted-foreground mb-4">Try a different name or email</p>
                <Button variant="ghost" onClick={() => setSearch('')}>Clear search</Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="py-0">
              <CardContent className="text-center py-8">
                <span className="text-4xl block mb-4">👥</span>
                <p className="text-muted-foreground mb-2">No clients yet</p>
                <p className="text-sm text-muted-foreground mb-4">Invite your first client to get started</p>
                <Button onClick={() => setShowAddClient(true)}>Invite Client</Button>
              </CardContent>
            </Card>
          )
        ) : (
          <div className="space-y-2" data-sentry-mask>
            {clients.map((client, index) => (
              <div
                key={client.client_id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card
                  className="py-0 cursor-pointer hover:bg-card/80 transition-colors"
                  onClick={() => setSelectedClient(client)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getStatusEmoji(client)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {client.username || client.email?.split('@')[0] || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-digital ${getStatusColor(client)}`}>
                          {client.workouts_last_7_days || 0} workouts
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {client.current_streak || 0} day streak
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {page + 1} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
        </>)}
      </div>

      {/* Client Detail Modal */}
      {selectedClient && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200"
          onClick={() => setSelectedClient(null)}
        >
          <div
            className="bg-card rounded-t-xl sm:rounded-xl w-full sm:max-w-md max-h-[85vh] overflow-auto animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card z-10">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedClient.username || selectedClient.email?.split('@')[0] || 'Unknown'}
                    </h2>
                    <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="text-muted-foreground hover:text-foreground text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Tab Navigation */}
              {selectedClient.onboarding_complete && (
                <div className="flex border-b border-border">
                  {(['overview', 'progress', 'activity', 'programs', 'checkins'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'flex-1 py-3 text-xs font-medium transition-colors',
                        activeTab === tab
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {tab === 'checkins' ? 'Check-ins' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-4" data-sentry-mask>
              {!selectedClient.onboarding_complete ? (
                <Card className="py-0">
                  <CardContent className="text-center py-6">
                    <span className="text-3xl block mb-2">⏳</span>
                    <p className="text-muted-foreground">Hasn't completed onboarding yet</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Loading/Error state for client details */}
                  {isClientDetailsLoading && (
                    <div className="text-center py-4">
                      <span className="text-2xl animate-pulse">...</span>
                      <p className="text-sm text-muted-foreground mt-1">Loading details...</p>
                    </div>
                  )}

                  {clientDetailsError && (
                    <Card className="py-0">
                      <CardContent className="text-center py-4">
                        <p className="text-sm text-destructive mb-2">{clientDetailsError}</p>
                        <Button size="sm" onClick={refreshClientDetails}>Retry</Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <>
                      {/* Status */}
                      <div className="grid grid-cols-2 gap-3">
                        <Card className="py-0">
                          <CardContent className="p-3">
                            <p className="text-xs text-muted-foreground mb-1">Level</p>
                            <p className="text-2xl font-bold font-digital text-primary">
                              {selectedClient.current_level || 1}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {selectedClient.total_xp?.toLocaleString() || 0} XP
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="py-0">
                          <CardContent className="p-3">
                            <p className="text-xs text-muted-foreground mb-1">Streak</p>
                            <p className="text-2xl font-bold font-digital text-secondary">
                              {selectedClient.current_streak || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Best: {selectedClient.longest_streak || 0}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Activity Summary */}
                      <Card className="py-0">
                        <CardContent className="p-4">
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3">ACTIVITY</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Last Check-in</span>
                              <span className={getStatusColor(selectedClient)}>
                                {selectedClient.last_check_in_date
                                  ? new Date(selectedClient.last_check_in_date).toLocaleDateString()
                                  : 'Never'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Workouts (7 days)</span>
                              <span>{selectedClient.workouts_last_7_days || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Goal</span>
                              <span className="capitalize">{selectedClient.goal || 'Not set'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Macro Targets */}
                      {selectedClient.client_id && user?.id && (
                        <MacroEditor
                          clientId={selectedClient.client_id}
                          currentTargets={clientMacroData.targets}
                          coachId={user.id}
                          onSaved={refreshClientDetails}
                        />
                      )}

                      {/* Mini Weight Chart */}
                      {clientWeightData.length > 0 && (
                        <Card className="py-0">
                          <CardContent className="p-4">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">WEIGHT TREND</h3>
                            <WeightChart data={clientWeightData} height={100} />
                            {clientWeightData.length >= 2 && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Change: {' '}
                                <span className={
                                  clientWeightData[clientWeightData.length - 1].weight < clientWeightData[0].weight
                                    ? 'text-success'
                                    : clientWeightData[clientWeightData.length - 1].weight > clientWeightData[0].weight
                                    ? 'text-destructive'
                                    : 'text-muted-foreground'
                                }>
                                  {(clientWeightData[clientWeightData.length - 1].weight - clientWeightData[0].weight).toFixed(1)} lbs
                                </span>
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}

                  {/* Progress Tab */}
                  {activeTab === 'progress' && (
                    <>
                      {/* Full Weight Chart */}
                      <Card className="py-0">
                        <CardContent className="p-4">
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3">WEIGHT TREND (30 DAYS)</h3>
                          <WeightChart data={clientWeightData} height={150} />
                          {clientWeightData.length >= 2 && (
                            <p className="text-sm text-muted-foreground mt-3">
                              Change: {' '}
                              <span className={cn(
                                'font-digital',
                                clientWeightData[clientWeightData.length - 1].weight < clientWeightData[0].weight
                                  ? 'text-success'
                                  : clientWeightData[clientWeightData.length - 1].weight > clientWeightData[0].weight
                                  ? 'text-destructive'
                                  : 'text-muted-foreground'
                              )}>
                                {(clientWeightData[clientWeightData.length - 1].weight - clientWeightData[0].weight).toFixed(1)} lbs
                              </span>
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Macro Adherence */}
                      <Card className="py-0">
                        <CardContent className="p-4">
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3">MACRO ADHERENCE (14 DAYS)</h3>
                          <ClientMacroAdherence data={clientMacroData} />
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* Activity Tab */}
                  {activeTab === 'activity' && (
                    <ClientActivityFeed activities={clientActivityData} />
                  )}

                  {/* Programs Tab */}
                  {activeTab === 'programs' && (
                    <>
                      {showClientAssigner ? (
                        <WorkoutAssigner
                          exercises={showInlineBuilder ? clientInlineExercises : (assigningTemplate?.exercises || [])}
                          templateId={assigningTemplate?.id}
                          templateName={assigningTemplate?.name || (showInlineBuilder ? 'Custom Workout' : undefined)}
                          clientId={selectedClient.client_id || undefined}
                          clientName={selectedClient.username || selectedClient.email?.split('@')[0] || undefined}
                          onAssigned={() => {
                            setShowClientAssigner(false)
                            setAssigningTemplate(null)
                            setShowInlineBuilder(false)
                            setClientInlineExercises([])
                            // Refresh assignments
                            if (selectedClient.client_id) {
                              const today = new Date()
                              const past30 = new Date(today)
                              past30.setDate(past30.getDate() - 30)
                              const future30 = new Date(today)
                              future30.setDate(future30.getDate() + 30)
                              fetchClientAssignments(
                                selectedClient.client_id,
                                past30.toISOString().split('T')[0],
                                future30.toISOString().split('T')[0]
                              ).then(setClientAssignments)
                            }
                          }}
                          onCancel={() => {
                            setShowClientAssigner(false)
                            setAssigningTemplate(null)
                            setShowInlineBuilder(false)
                            setClientInlineExercises([])
                          }}
                        />
                      ) : showInlineBuilder ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setShowInlineBuilder(false); setClientInlineExercises([]) }}
                            >
                              <ArrowLeft size={16} className="mr-1" />
                              Back
                            </Button>
                            <h3 className="text-sm font-semibold text-muted-foreground">BUILD CUSTOM WORKOUT</h3>
                          </div>
                          <WorkoutBuilder
                            exercises={clientInlineExercises}
                            onChange={setClientInlineExercises}
                          />
                          <Button
                            className="w-full"
                            disabled={clientInlineExercises.length === 0 || clientInlineExercises.every(e => !e.name.trim())}
                            onClick={() => setShowClientAssigner(true)}
                          >
                            <Send size={16} className="mr-1" />
                            Assign This Workout
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Action buttons */}
                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              variant="ghost"
                              onClick={() => setShowInlineBuilder(true)}
                            >
                              <Plus size={16} className="mr-1" />
                              Custom Workout
                            </Button>
                            {templates.length > 0 && (
                              <div className="flex-1">
                                <select
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  value=""
                                  onChange={(e) => {
                                    const tmpl = templates.find(t => t.id === e.target.value)
                                    if (tmpl) {
                                      setAssigningTemplate(tmpl)
                                      setShowClientAssigner(true)
                                    }
                                  }}
                                >
                                  <option value="">Assign Template...</option>
                                  {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Assigned workouts list */}
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                              ASSIGNED WORKOUTS
                            </h3>
                            {clientAssignments.length === 0 ? (
                              <Card className="py-0">
                                <CardContent className="text-center py-6">
                                  <Dumbbell size={32} className="mx-auto mb-2 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">
                                    No workouts assigned yet
                                  </p>
                                </CardContent>
                              </Card>
                            ) : (
                              <div className="space-y-2">
                                {clientAssignments
                                  .sort((a, b) => b.date.localeCompare(a.date))
                                  .map((assignment) => {
                                    const isUpcoming = assignment.date >= getLocalDateString()
                                    const matchedTemplate = templates.find(t => t.id === assignment.template_id)
                                    return (
                                      <Card key={assignment.id} className="py-0">
                                        <CardContent className="p-3">
                                          <div className="flex items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2">
                                                <p className="font-medium truncate">
                                                  {matchedTemplate?.name || 'Custom Workout'}
                                                </p>
                                                {isUpcoming && (
                                                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                                                    Upcoming
                                                  </span>
                                                )}
                                              </div>
                                              <p className="text-xs text-muted-foreground">
                                                {new Date(assignment.date + 'T00:00:00').toLocaleDateString()}
                                                {' '}&middot;{' '}
                                                {assignment.exercises.length} exercise{assignment.exercises.length !== 1 ? 's' : ''}
                                              </p>
                                              {assignment.notes && (
                                                <p className="text-xs text-muted-foreground mt-1 italic truncate">
                                                  {assignment.notes}
                                                </p>
                                              )}
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleDeleteAssignment(assignment.id)}
                                              className="text-destructive hover:text-destructive"
                                            >
                                              <Trash2 size={14} />
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    )
                                  })}
                              </div>
                            )}
                          </div>

                          {/* Completed assigned workouts */}
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                              COMPLETED WORKOUTS
                            </h3>
                            {completedLoading ? (
                              <div className="text-center py-4">
                                <span className="text-lg animate-pulse">...</span>
                                <p className="text-xs text-muted-foreground mt-1">Loading completed workouts...</p>
                              </div>
                            ) : completedAssignments.length === 0 ? (
                              <Card className="py-0">
                                <CardContent className="text-center py-4">
                                  <p className="text-sm text-muted-foreground">
                                    No completed assigned workouts yet.
                                  </p>
                                </CardContent>
                              </Card>
                            ) : (
                              <div className="space-y-2">
                                {completedAssignments.map((pair) => {
                                  const isExpanded = expandedCompletedId === pair.log.id
                                  const matchedTemplate = templates.find(t => t.id === pair.assignment.template_id)
                                  return (
                                    <Card key={pair.log.id} className="py-0">
                                      <CardContent className="p-0">
                                        <button
                                          type="button"
                                          className="w-full p-3 flex items-center gap-3 text-left"
                                          onClick={() => setExpandedCompletedId(isExpanded ? null : pair.log.id)}
                                        >
                                          {isExpanded ? (
                                            <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                                          ) : (
                                            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">
                                              {matchedTemplate?.name || 'Custom Workout'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {new Date(pair.log.date + 'T00:00:00').toLocaleDateString()}
                                              {' '}&middot;{' '}
                                              {pair.assignment.exercises.length} prescribed
                                            </p>
                                          </div>
                                          <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-medium shrink-0">
                                            Completed
                                          </span>
                                        </button>
                                        {isExpanded && (
                                          <div className="px-3 pb-3 border-t border-border pt-3">
                                            <PrescribedVsActual
                                              prescribed={pair.assignment.exercises}
                                              actual={pair.log.exercises}
                                            />
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Check-ins Tab */}
                  {activeTab === 'checkins' && (
                    <div className="space-y-3">
                      {clientCheckinsLoading ? (
                        <div className="text-center py-4">
                          <span className="text-2xl animate-pulse">...</span>
                          <p className="text-sm text-muted-foreground mt-1">Loading check-ins...</p>
                        </div>
                      ) : clientCheckinsList.length === 0 ? (
                        <Card className="py-0">
                          <CardContent className="text-center py-6">
                            <ClipboardCheck size={32} className="mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No check-ins yet</p>
                          </CardContent>
                        </Card>
                      ) : (
                        clientCheckinsList.map((checkin) => {
                          const isExpanded = expandedCheckinId === checkin.id
                          return (
                            <Card key={checkin.id} className="py-0">
                              <CardContent className="p-0">
                                <button
                                  type="button"
                                  className="w-full p-3 flex items-center gap-3 text-left"
                                  onClick={() => setExpandedCheckinId(isExpanded ? null : checkin.id)}
                                >
                                  {isExpanded ? (
                                    <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                                  ) : (
                                    <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">
                                      Week of {new Date(checkin.week_of + 'T00:00:00').toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {getTimeAgo(checkin.created_at)}
                                    </p>
                                  </div>
                                  <span className={cn(
                                    'text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
                                    checkin.status === 'reviewed'
                                      ? 'bg-success/20 text-success'
                                      : 'bg-warning/20 text-warning'
                                  )}>
                                    {checkin.status === 'reviewed' ? 'Reviewed' : 'Submitted'}
                                  </span>
                                </button>
                                {isExpanded && (
                                  <div className="px-3 pb-3 border-t border-border pt-3 space-y-3">
                                    {getCheckinSections(checkin).map((section) => (
                                      <div key={section.title}>
                                        <h4 className="text-xs font-semibold text-muted-foreground mb-1">{section.title.toUpperCase()}</h4>
                                        {section.fields.map((field) => (
                                          <div key={field.label} className="mb-1.5">
                                            <span className="text-xs text-muted-foreground">{field.label}: </span>
                                            <span className="text-sm">{field.value}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                    {checkin.status === 'reviewed' && checkin.coach_response && (
                                      <div className="bg-background rounded-lg p-3 mt-2">
                                        <p className="text-xs font-semibold text-muted-foreground mb-1">COACH RESPONSE</p>
                                        <p className="text-sm whitespace-pre-wrap">{checkin.coach_response}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-border">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => selectedClient.client_id && handleRemoveClient(selectedClient.client_id)}
                >
                  Remove Client
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClient && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => {
            setShowAddClient(false)
            setInviteEmail('')
            setInviteStatus('idle')
            setInviteMessage('')
          }}
        >
          <div
            className="bg-card rounded-xl p-6 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">Invite Client</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your client's email address to send them a signup invite.
            </p>

            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="client@example.com"
              className="mb-4"
              autoFocus
            />

            {inviteMessage && (
              <p className={cn(
                'text-sm mb-4',
                inviteStatus === 'success' ? 'text-success' : 'text-destructive'
              )}>
                {inviteMessage}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddClient(false)
                  setInviteEmail('')
                  setInviteStatus('idle')
                  setInviteMessage('')
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleInviteClient()}
                disabled={!inviteEmail.trim() || inviteStatus === 'loading'}
              >
                {inviteStatus === 'loading' ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
