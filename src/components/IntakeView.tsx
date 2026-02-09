import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/cn'
import { fetchSubmissions, fetchSubmissionById, updateSubmission, getPhotoUrl } from '@/lib/intakeApi'
import { STATUS_OPTIONS, SECTION_CONFIG } from '@/lib/intakeTypes'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import type { SubmissionWithPhotos, SubmissionStatus } from '@/lib/intakeTypes'

// ---------------------------------------------------------------------------
// Status badge with intake-specific colors
// ---------------------------------------------------------------------------
const STATUS_VARIANT: Record<SubmissionStatus, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  new: 'destructive',
  reviewed: 'outline',
  active: 'default',
  archived: 'secondary',
}

function IntakeStatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Submission Detail
// ---------------------------------------------------------------------------
function SubmissionDetail({
  submissionId,
  onBack,
}: {
  submissionId: string
  onBack: () => void
}) {
  const [submission, setSubmission] = useState<SubmissionWithPhotos | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<SubmissionStatus>('new')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchSubmissionById(submissionId)
        if (cancelled) return
        if (!data) {
          setError('Submission not found')
          return
        }
        setSubmission(data)
        setStatus(data.status)
        setNotes(data.coach_notes || '')

        if (data.intake_photos?.length > 0) {
          const urls: Record<string, string> = {}
          for (const photo of data.intake_photos) {
            if (cancelled) return
            urls[photo.id] = await getPhotoUrl(photo.storage_path)
          }
          if (!cancelled) setPhotoUrls(urls)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load submission')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [submissionId])

  const handleStatusChange = useCallback(
    async (newStatus: SubmissionStatus) => {
      if (!submission) return
      const prev = status
      setStatus(newStatus)

      try {
        await updateSubmission(submission.id, { status: newStatus })
        setSaveMessage('Status updated')
        setTimeout(() => setSaveMessage(null), 3000)
      } catch {
        setStatus(prev)
        setSaveMessage('Failed to update status')
        setTimeout(() => setSaveMessage(null), 3000)
      }
    },
    [submission, status]
  )

  const handleSaveNotes = useCallback(async () => {
    if (!submission) return
    setSaving(true)
    try {
      await updateSubmission(submission.id, { coach_notes: notes })
      setSaveMessage('Notes saved')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch {
      setSaveMessage('Failed to save notes')
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setSaving(false)
    }
  }, [submission, notes])

  const formatPhotoType = (t: string) =>
    t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  const formatValue = (v: unknown): string => {
    if (v === null || v === undefined || v === '') return '—'
    if (typeof v === 'boolean') return v ? 'Yes' : 'No'
    return String(v)
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return d
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-lg animate-pulse text-muted-foreground">Loading submission...</span>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="text-center py-16 text-destructive">{error || 'Submission not found'}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to Submissions
      </button>

      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold">{submission.full_name}</h2>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <a href={`mailto:${submission.email}`} className="text-primary hover:underline">
            {submission.email}
          </a>
          {submission.phone && <span>{submission.phone}</span>}
          {submission.city_state_timezone && <span>{submission.city_state_timezone}</span>}
          <span>{formatDate(submission.created_at)}</span>
        </div>

        {/* Status control */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="intake-status" className="text-sm text-muted-foreground">Status:</label>
            <select
              id="intake-status"
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as SubmissionStatus)}
              className="bg-background border border-border text-foreground rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <IntakeStatusBadge status={status} />
          {saveMessage && <span className="text-sm text-muted-foreground">{saveMessage}</span>}
        </div>
      </div>

      {/* Coach Notes */}
      <Card className="py-0">
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold">Coach Notes</h3>
            <p className="text-xs text-muted-foreground">Private — only visible to you</p>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your private notes here..."
            className="min-h-[100px] resize-y"
          />
          <Button onClick={handleSaveNotes} disabled={saving} size="sm">
            {saving ? 'Saving...' : 'Save Notes'}
          </Button>
        </CardContent>
      </Card>

      {/* Photos */}
      {submission.intake_photos && submission.intake_photos.length > 0 && (
        <Card className="py-0">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Progress Photos</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {submission.intake_photos.map((photo) => {
                const url = photoUrls[photo.id]
                return (
                  <div key={photo.id} className="space-y-1">
                    {url ? (
                      <img
                        src={url}
                        alt={formatPhotoType(photo.photo_type)}
                        className="w-full aspect-[3/4] object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-muted rounded-lg animate-pulse" />
                    )}
                    <p className="text-xs text-muted-foreground text-center">
                      {formatPhotoType(photo.photo_type)}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data sections */}
      <div className="space-y-3">
        {SECTION_CONFIG.map((section, i) => (
          <details
            key={section.title}
            className="group bg-card border border-border rounded-lg overflow-hidden"
            open={i === 0}
          >
            <summary className="cursor-pointer px-4 py-3 font-semibold flex items-center justify-between hover:bg-muted/30 transition-colors">
              <span>{section.title}</span>
              <ChevronDown size={18} className="text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-4 py-3 space-y-3 border-t border-border">
              {section.fields.map((field) => {
                const value = submission[field.key]
                const formatted = formatValue(value)
                if (formatted === '—') return null

                const isLong = typeof value === 'string' && value.length > 100

                return (
                  <div
                    key={field.key}
                    className={isLong ? 'space-y-1' : 'flex justify-between items-start'}
                  >
                    <dt className={cn('text-sm text-muted-foreground', !isLong && 'flex-shrink-0 w-1/3')}>
                      {field.label}
                    </dt>
                    <dd className={cn('text-sm', isLong ? 'whitespace-pre-wrap' : 'w-2/3 text-right')}>
                      {formatted}
                    </dd>
                  </div>
                )
              })}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Submissions List
// ---------------------------------------------------------------------------
function SubmissionsList({ onSelect }: { onSelect: (id: string) => void }) {
  const [submissions, setSubmissions] = useState<SubmissionWithPhotos[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>('all')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchSubmissions()
        if (!cancelled) setSubmissions(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load submissions')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return submissions
    return submissions.filter((s) => s.status === activeFilter)
  }, [submissions, activeFilter])

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: submissions.length }
    STATUS_OPTIONS.forEach(({ value }) => {
      m[value] = submissions.filter((s) => s.status === value).length
    })
    return m
  }, [submissions])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-lg animate-pulse text-muted-foreground">Loading submissions...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-destructive">{error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            activeFilter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          All ({counts.all})
        </button>
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeFilter === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {label} ({counts[value]})
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          {activeFilter === 'all'
            ? 'No submissions yet.'
            : `No ${activeFilter} submissions.`}
        </div>
      )}

      {/* Submission cards */}
      {filtered.map((sub) => (
        <Card
          key={sub.id}
          className="py-0 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => onSelect(sub.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold">{sub.full_name}</p>
                <p className="text-sm text-muted-foreground">{sub.email}</p>
              </div>
              <IntakeStatusBadge status={sub.status} />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {sub.primary_goal && (
                <span className="flex-1 min-w-[180px]">
                  <span className="text-foreground/50">Goal:</span>{' '}
                  {sub.primary_goal.length > 60 ? sub.primary_goal.substring(0, 60) + '...' : sub.primary_goal}
                </span>
              )}
              {sub.commitment_level != null && (
                <span><span className="text-foreground/50">Commitment:</span> {sub.commitment_level}/10</span>
              )}
              <span>
                <span className="text-foreground/50">Submitted:</span>{' '}
                {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span>
                <span className="text-foreground/50">Photos:</span> {sub.intake_photos.length}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Intake View (exported)
// ---------------------------------------------------------------------------
export function IntakeView() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (selectedId) {
    return <SubmissionDetail submissionId={selectedId} onBack={() => setSelectedId(null)} />
  }

  return <SubmissionsList onSelect={setSelectedId} />
}
