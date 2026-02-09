# Roadmap: Trained

## Milestones

- v1.0 Launch Polish (Phases 1-5, shipped 2026-02-04)
- v1.1 Design Refresh (7 phases, shipped 2026-02-05)
- v1.2 Pre-Launch Confidence (4 phases, shipped 2026-02-07)
- v1.3 Coach Dashboard (Phases 1-6, shipped 2026-02-08)
- **v1.4 Intake Dashboard** (Phases 7-10, in progress)

## v1.4 Intake Dashboard

**Milestone Goal:** Integrate the archived intake submissions dashboard into the coach section -- a 4th "Intake" segment for viewing/managing all submissions, plus a client detail tab for linked submissions, with manual client-submission linking. All ported code adapted to shadcn/ui + CVA + existing Supabase client patterns.

### Phases

- [ ] **Phase 7: Intake Foundation** - Types, API layer, and 4th segment tab wired into Coach dashboard
- [ ] **Phase 8: Submissions List** - Filterable submission list with status tabs and new-count badge
- [ ] **Phase 9: Submission Detail** - Full detail view with collapsible sections, photo gallery, status management, and coach notes
- [ ] **Phase 10: Client Linking** - Intake tab in client detail modal with manual submission linking

## Phase Details

### Phase 7: Intake Foundation
**Goal**: Coach sees "Intake" as a functional 4th segment in the Coach dashboard, backed by adapted types and API layer
**Depends on**: Nothing (first phase of v1.4; builds on existing Coach.tsx from v1.3)
**Requirements**: INTAKE-01, ADAPT-02, ADAPT-03
**Success Criteria** (what must be TRUE):
  1. Coach can tap "Intake" as a 4th segment alongside Clients / Templates / Check-ins in the Coach dashboard
  2. The Intake segment renders a placeholder view when selected (content delivered in Phase 8)
  3. Intake types (Submission, IntakePhoto, SubmissionStatus, etc.) are available for import from the trained-app codebase
  4. API functions (fetchSubmissions, fetchSubmissionById, updateSubmission, getPhotoUrl) call getSupabaseClient() and work against the existing intake_submissions/intake_photos tables
  5. The Intake view is lazy-loaded consistent with other coach features (code-split, Suspense boundary)
**Plans**: TBD

Plans:
- [ ] 07-01: Port types, adapt API layer, wire 4th segment tab with lazy-loaded placeholder

### Phase 8: Submissions List
**Goal**: Coach can browse and filter all intake submissions from the Intake segment
**Depends on**: Phase 7
**Requirements**: INTAKE-02, INTAKE-03, INTAKE-04, ADAPT-01
**Success Criteria** (what must be TRUE):
  1. Coach can view a list of all intake submissions ordered by submission date (newest first), showing name, email, goal, commitment level, date, and photo count
  2. Coach can filter submissions by status (All / New / Reviewed / Active / Archived) with visible counts per status tab
  3. Coach can see a badge on the Intake segment tab showing the count of new (unreviewed) submissions
  4. Submission rows and status badges use shadcn/ui + CVA styling consistent with the trained-app design system (no plain Tailwind color classes like bg-red-100)
**Plans**: TBD

Plans:
- [ ] 08-01: Port SubmissionsList and StatusBadge, restyle to design system, wire new-count badge on segment tab

### Phase 9: Submission Detail
**Goal**: Coach can drill into any submission to review all data, manage photos, change status, and write notes
**Depends on**: Phase 8
**Requirements**: DETAIL-01, DETAIL-02, DETAIL-03, DETAIL-04, DETAIL-05
**Success Criteria** (what must be TRUE):
  1. Coach can click a submission row in the list to navigate to its full detail view
  2. Coach can view all submission data organized in 10 collapsible sections (~50 fields) with sections defaulting to collapsed
  3. Coach can view intake photos in a gallery that loads signed URLs (1-hour expiry) from the private intake-photos storage bucket
  4. Coach can change a submission's status via a dropdown, with the change applied optimistically (immediate UI update, reverted on error)
  5. Coach can write and save private coach notes on a submission, with the notes persisted to the database
**Plans**: TBD

Plans:
- [ ] 09-01: Port SubmissionDetail with collapsible sections, photo gallery, status dropdown, and coach notes

### Phase 10: Client Linking
**Goal**: Coach can associate intake submissions with clients and view linked submissions from the client detail modal
**Depends on**: Phase 9 (needs working submission data and detail view)
**Requirements**: LINK-01, LINK-02
**Success Criteria** (what must be TRUE):
  1. Coach can see an "Intake" tab in the client detail modal alongside existing tabs
  2. Coach can link an intake submission to a client from the client detail Intake tab (selecting from unlinked submissions)
  3. Coach can view a linked submission's summary (name, status, date, goal) directly in the client detail Intake tab without navigating away

Plans:
- [ ] 10-01: Add Intake tab to client detail modal with submission linking and summary display

## Progress

**Execution Order:** 7 -> 8 -> 9 -> 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 7. Intake Foundation | v1.4 | 0/1 | Not started | - |
| 8. Submissions List | v1.4 | 0/1 | Not started | - |
| 9. Submission Detail | v1.4 | 0/1 | Not started | - |
| 10. Client Linking | v1.4 | 0/1 | Not started | - |
