import { getSupabase } from './supabase'
import type {
  Submission,
  SubmissionWithPhotos,
  SubmissionStatus,
} from '../types/dashboard'

// =====================================================
// FETCH SUBMISSIONS
// =====================================================

export async function fetchSubmissions(
  statusFilter?: SubmissionStatus
): Promise<SubmissionWithPhotos[]> {
  const supabase = getSupabase()

  let query = supabase
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

// =====================================================
// FETCH SUBMISSION BY ID
// =====================================================

export async function fetchSubmissionById(
  id: string
): Promise<SubmissionWithPhotos | null> {
  const supabase = getSupabase()

  const { data, error } = await supabase
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
      // Not found
      return null
    }
    throw new Error(`Failed to fetch submission: ${error.message}`)
  }

  return data as SubmissionWithPhotos
}

// =====================================================
// UPDATE SUBMISSION
// =====================================================

interface SubmissionUpdates {
  status?: SubmissionStatus
  coach_notes?: string
}

export async function updateSubmission(
  id: string,
  updates: SubmissionUpdates
): Promise<Submission> {
  const supabase = getSupabase()

  const { data, error } = await supabase
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

// =====================================================
// GET PHOTO URL
// =====================================================

export async function getPhotoUrl(storagePath: string): Promise<string> {
  const supabase = getSupabase()

  const { data, error } = await supabase.storage
    .from('intake-photos')
    .createSignedUrl(storagePath, 3600) // 1 hour expiry

  if (error || !data?.signedUrl) {
    console.error('Error getting photo URL:', error)
    return ''
  }

  return data.signedUrl
}
