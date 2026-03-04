# Coach Dashboard — Handoff Doc

Archived from `welltrained` landing site repo. This code implements a coach-facing dashboard for reviewing client intake submissions. It was removed from the marketing site because a standalone web app now serves the same purpose against the same Supabase backend.

## What the Code Does

- **Auth**: Email/password sign-in via Supabase Auth (`AuthContext` + `useAuth` hook). Wraps protected routes with `ProtectedRoute` (redirects to `/coach/login` if unauthenticated).
- **Submissions List** (`SubmissionsList`): Fetches all intake submissions ordered by `created_at` desc, with client-side status filtering (all / new / reviewed / active / archived). Each row shows name, email, goal, commitment level, submission date, and photo count.
- **Submission Detail** (`SubmissionDetail`): Single-submission view with collapsible data sections (personal info, body comp, goals, training, nutrition, supplements, health, lifestyle, coaching prefs, agreement). Includes:
  - Status dropdown with optimistic updates
  - Coach notes textarea with save
  - Photo gallery using signed URLs (1-hour expiry)
- **Status Badge** (`StatusBadge`): Colored pill for submission status.

## Supabase Schema

### Tables

**`intake_submissions`** — one row per client intake form submission.
- System fields: `id` (uuid), `created_at`, `updated_at`, `status` (text: `new`|`reviewed`|`active`|`archived`), `coach_notes` (text, nullable)
- ~50+ data columns covering personal info, body comp, goals, training, nutrition, supplements, health, lifestyle, coaching prefs, agreement (see `Submission` type below)

**`intake_photos`** — one row per uploaded photo, linked to a submission.
- `id` (uuid), `submission_id` (fk → intake_submissions), `photo_type` (text: `front_relaxed`|`back_relaxed`|`side_relaxed`|`front_flexed`), `storage_path` (text), `created_at`

### Storage

**Bucket: `intake-photos`** — private bucket. Photos accessed via signed URLs (`createSignedUrl` with 1-hour expiry).

## API Functions (`src/lib/dashboardApi.ts`)

```ts
fetchSubmissions(statusFilter?: SubmissionStatus): Promise<SubmissionWithPhotos[]>
```
Fetches all submissions with nested `intake_photos`, ordered by `created_at` desc. Optional status filter.

```ts
fetchSubmissionById(id: string): Promise<SubmissionWithPhotos | null>
```
Fetches single submission with photos. Returns `null` for not-found (PGRST116).

```ts
updateSubmission(id: string, updates: { status?: SubmissionStatus; coach_notes?: string }): Promise<Submission>
```
Patches a submission. Automatically sets `updated_at` to current timestamp.

```ts
getPhotoUrl(storagePath: string): Promise<string>
```
Creates a 1-hour signed URL for a photo in the `intake-photos` bucket. Returns empty string on error.

## Type Definitions (`src/types/dashboard.ts`)

```ts
type SubmissionStatus = 'new' | 'reviewed' | 'active' | 'archived'

interface IntakePhoto {
  id: string
  submission_id: string
  photo_type: 'front_relaxed' | 'back_relaxed' | 'side_relaxed' | 'front_flexed'
  storage_path: string
  created_at: string
}

interface Submission {
  // ~50+ fields — see full type in src/types/dashboard.ts
  id: string
  created_at: string
  updated_at: string
  status: SubmissionStatus
  coach_notes: string | null
  full_name: string
  email: string
  // ... (all intake form fields)
  agreement_signed: boolean
}

type SubmissionWithPhotos = Submission & { intake_photos: IntakePhoto[] }
```

### Constants

- `STATUS_OPTIONS` — array of `{ value: SubmissionStatus, label: string }` for filter tabs and dropdowns
- `SECTION_CONFIG` — array of `{ title: string, fields: { key: keyof Submission, label: string }[] }` defining the collapsible data sections in the detail view (10 sections, ~50 fields total)

## Key Patterns

1. **Lazy Supabase client**: All API functions call `getSupabase()` (from `src/lib/supabase.ts`) which lazily initializes the client. The standalone app should swap this import to use its own Supabase client instance.

2. **Signed URLs for photos**: Photos are in a private bucket. `getPhotoUrl()` creates time-limited signed URLs. The detail view loads all photo URLs on mount and stores them in a `Record<string, string>` keyed by photo ID.

3. **Optimistic status updates**: `SubmissionDetail` immediately updates the local `status` state, then calls the API. On error, it reverts to the previous status.

4. **Auth flow**: `AuthProvider` wraps the app, initializes session from `getSession()`, and subscribes to `onAuthStateChange`. `ProtectedRoute` uses `Outlet` for nested route rendering.

## How to Adapt for the Standalone App

1. **Swap Supabase client import**: Replace `import { getSupabase } from './supabase'` in `dashboardApi.ts` and `AuthContext.tsx` with whatever client your app exposes.

2. **Adjust routing**: The original routes were nested under `/coach`. Update `navigate()` calls in `LoginForm.tsx` (`/coach` -> your dashboard root), `SubmissionDetail.tsx` (`/coach` back button), and `SubmissionsList.tsx` (`/coach/submission/:id` links).

3. **Styling**: Uses Tailwind CSS v4 with custom theme tokens (`trained-black`, `trained-red`, `trained-text`, `trained-text-dim`, `trained-dark`). Either bring those theme values or remap to your app's design tokens.

4. **Dependencies**: React 19, React Router (v7 `react-router` package), `@supabase/supabase-js`, Tailwind CSS v4.

## File Inventory

```
src/
  components/dashboard/
    LoginForm.tsx          — email/password login form
    ProtectedRoute.tsx     — auth guard with loading state
    StatusBadge.tsx        — colored status pill
    SubmissionDetail.tsx   — full submission view with photos, notes, status
    SubmissionsList.tsx    — filterable list of all submissions
  contexts/
    AuthContext.tsx         — React context for Supabase auth
  hooks/
    useAuth.ts             — convenience hook for AuthContext
  lib/
    dashboardApi.ts        — Supabase query functions
  routes/
    CoachDashboard.tsx     — page layout with header, sign-out, SubmissionsList
  types/
    dashboard.ts           — TypeScript types, status options, section config
```
