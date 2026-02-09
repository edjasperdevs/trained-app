import { getSupabaseClient } from '@/lib/supabase'
import type {
  Submission,
  SubmissionWithPhotos,
  SubmissionStatus,
} from '@/lib/intakeTypes'

// intake_submissions / intake_photos aren't in generated database.types yet,
// so we use an untyped reference for .from() calls.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => getSupabaseClient() as any

export async function fetchSubmissions(
  statusFilter?: SubmissionStatus
): Promise<SubmissionWithPhotos[]> {
  let query = db()
    .from('intake_submissions')
    .select(
      `
      *,
      intake_photos (
        id,
        submission_id,
        photo_type,
        storage_path,
        created_at
      )
    `
    )
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch submissions: ${error.message}`)
  }

  return data as SubmissionWithPhotos[]
}

export async function fetchSubmissionById(
  id: string
): Promise<SubmissionWithPhotos | null> {
  const { data, error } = await db()
    .from('intake_submissions')
    .select(
      `
      *,
      intake_photos (
        id,
        submission_id,
        photo_type,
        storage_path,
        created_at
      )
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch submission: ${error.message}`)
  }

  return data as SubmissionWithPhotos
}

export async function updateSubmission(
  id: string,
  updates: { status?: SubmissionStatus; coach_notes?: string }
): Promise<Submission> {
  const { data, error } = await db()
    .from('intake_submissions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update submission: ${error.message}`)
  }

  return data as Submission
}

export async function getPhotoUrl(storagePath: string): Promise<string> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.storage
    .from('intake-photos')
    .createSignedUrl(storagePath, 3600)

  if (error || !data?.signedUrl) {
    console.error('Error getting photo URL:', error)
    return ''
  }

  return data.signedUrl
}
