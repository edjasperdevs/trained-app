import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  fetchSubmissionById,
  updateSubmission,
  getPhotoUrl,
} from '../../lib/dashboardApi'
import type {
  SubmissionWithPhotos,
  SubmissionStatus,
} from '../../types/dashboard'
import { SECTION_CONFIG, STATUS_OPTIONS } from '../../types/dashboard'
import StatusBadge from './StatusBadge'

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [submission, setSubmission] = useState<SubmissionWithPhotos | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<SubmissionStatus>('new')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) return

    async function loadSubmission() {
      try {
        const data = await fetchSubmissionById(id!)
        if (!data) {
          setError('Submission not found')
          return
        }
        setSubmission(data)
        setStatus(data.status)
        setNotes(data.coach_notes || '')

        // Load signed photo URLs
        if (data.intake_photos?.length > 0) {
          const urls: Record<string, string> = {}
          for (const photo of data.intake_photos) {
            urls[photo.id] = await getPhotoUrl(photo.storage_path)
          }
          setPhotoUrls(urls)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load submission')
      } finally {
        setLoading(false)
      }
    }

    loadSubmission()
  }, [id])

  const handleStatusChange = useCallback(
    async (newStatus: SubmissionStatus) => {
      if (!submission) return

      const previousStatus = status
      setStatus(newStatus) // Optimistic update

      try {
        await updateSubmission(submission.id, { status: newStatus })
        setSaveMessage('Status updated')
        setTimeout(() => setSaveMessage(null), 3000)
      } catch (err) {
        setStatus(previousStatus) // Revert on error
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
    } catch (err) {
      setSaveMessage('Failed to save notes')
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setSaving(false)
    }
  }, [submission, notes])

  const formatPhotoType = (photoType: string): string => {
    return photoType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatFieldValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') {
      return '—'
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    return String(value)
  }

  const isLongText = (value: unknown): boolean => {
    if (typeof value !== 'string') return false
    return value.length > 100
  }

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-trained-dark flex items-center justify-center">
        <div className="text-trained-text">Loading submission...</div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-trained-dark flex items-center justify-center">
        <div className="text-trained-red">{error || 'Submission not found'}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-trained-dark">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/coach')}
          className="flex items-center gap-2 text-sm text-trained-text-dim hover:text-trained-text mb-6 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Submissions
        </button>

        {/* Header section */}
        <div className="mb-8 space-y-4">
          <h1 className="text-3xl font-bold text-trained-text">
            {submission.full_name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-trained-text-dim">
            <a
              href={`mailto:${submission.email}`}
              className="text-trained-red hover:underline"
            >
              {submission.email}
            </a>
            {submission.phone && <span>{submission.phone}</span>}
            {submission.city_state_timezone && (
              <span>{submission.city_state_timezone}</span>
            )}
            <span>{formatDate(submission.created_at)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="status-select"
                className="text-sm text-trained-text-dim"
              >
                Status:
              </label>
              <select
                id="status-select"
                value={status}
                onChange={(e) =>
                  handleStatusChange(e.target.value as SubmissionStatus)
                }
                className="bg-[#1a1a1a] border border-[#2a2a2a] text-trained-text rounded px-3 py-1.5 text-sm focus:outline-none focus:border-trained-red"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <StatusBadge status={status} />
            {saveMessage && (
              <span className="text-sm text-trained-text-dim">
                {saveMessage}
              </span>
            )}
          </div>
        </div>

        {/* Coach Notes section */}
        <div className="mb-8 p-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
          <div className="mb-2">
            <label
              htmlFor="coach-notes"
              className="text-lg font-semibold text-trained-text"
            >
              Coach Notes
            </label>
            <p className="text-xs text-trained-text-dim mt-1">
              Private — only visible to you
            </p>
          </div>
          <textarea
            id="coach-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your private notes here..."
            className="w-full min-h-[120px] resize-y bg-[#0f0f0f] border border-[#2a2a2a] text-trained-text rounded px-4 py-3 focus:outline-none focus:border-trained-red"
          />
          <button
            onClick={handleSaveNotes}
            disabled={saving}
            className="mt-3 px-4 py-2 bg-trained-red text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>

        {/* Progress Photos section */}
        {submission.intake_photos && submission.intake_photos.length > 0 && (
          <div className="mb-8 p-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
            <h2 className="text-lg font-semibold text-trained-text mb-4">
              Progress Photos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {submission.intake_photos.map((photo) => {
                const url = photoUrls[photo.id]
                return (
                  <div key={photo.id} className="space-y-2">
                    {url ? (
                      <img
                        src={url}
                        alt={formatPhotoType(photo.photo_type)}
                        className="w-full aspect-[3/4] object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-white/5 rounded-lg animate-pulse" />
                    )}
                    <p className="text-xs text-trained-text-dim text-center">
                      {formatPhotoType(photo.photo_type)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Data sections */}
        <div className="space-y-4">
          {SECTION_CONFIG.map((section, sectionIndex) => (
            <details
              key={section.title}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden group"
              open={sectionIndex === 0}
            >
              <summary className="cursor-pointer px-6 py-4 font-semibold text-trained-text bg-[#1a1a1a] hover:bg-[#252525] transition-colors flex items-center justify-between">
                <span>{section.title}</span>
                <svg
                  className="w-5 h-5 text-trained-text-dim transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="px-6 py-4 space-y-4">
                {section.fields.map((field) => {
                  const value = submission[field.key]
                  const formattedValue = formatFieldValue(value)

                  // Skip empty values
                  if (
                    formattedValue === '—' &&
                    field.key !== 'coach_notes' &&
                    field.key !== 'status'
                  ) {
                    return null
                  }

                  const isLong = isLongText(value)

                  return (
                    <div
                      key={field.key}
                      className={`${isLong ? 'space-y-1' : 'flex justify-between items-start'}`}
                    >
                      <dt
                        className={`text-sm text-trained-text-dim ${isLong ? '' : 'flex-shrink-0 w-1/3'}`}
                      >
                        {field.label}:
                      </dt>
                      <dd
                        className={`text-sm text-trained-text ${isLong ? 'whitespace-pre-wrap' : 'w-2/3'}`}
                      >
                        {formattedValue}
                      </dd>
                    </div>
                  )
                })}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
