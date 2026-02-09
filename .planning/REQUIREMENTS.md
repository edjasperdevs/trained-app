# Requirements: Trained v1.4 Intake Dashboard

**Defined:** 2026-02-08
**Core Value:** The coach can manage every client's training from one place -- programs, macros, check-ins -- and clients see their personalized plans without friction

## v1.4 Requirements

Integrate archived intake submissions dashboard into the coach section. Tables (intake_submissions, intake_photos) and intake form already exist -- this milestone adapts the coach-side viewer into trained-app's design system and Coach.tsx patterns.

### Intake Segment

- [ ] **INTAKE-01**: Coach can see "Intake" as a 4th segment in the Coach dashboard alongside Clients / Templates / Check-ins
- [ ] **INTAKE-02**: Coach can view a list of all intake submissions ordered by submission date (newest first)
- [ ] **INTAKE-03**: Coach can filter submissions by status (All / New / Reviewed / Active / Archived) with counts per status
- [ ] **INTAKE-04**: Coach can see a badge on the Intake segment tab showing count of new submissions

### Submission Detail

- [ ] **DETAIL-01**: Coach can click a submission row to navigate to its full detail view
- [ ] **DETAIL-02**: Coach can view submission data organized in collapsible sections (10 sections, ~50 fields)
- [ ] **DETAIL-03**: Coach can view intake photos in a gallery using signed URLs (1-hour expiry)
- [ ] **DETAIL-04**: Coach can change submission status via dropdown with optimistic updates
- [ ] **DETAIL-05**: Coach can write and save private coach notes on a submission

### Client Linking

- [ ] **LINK-01**: Coach can link an intake submission to a client from the client detail Intake tab
- [ ] **LINK-02**: Coach can view a linked submission's summary in the client detail Intake tab

### Code Adaptation

- [ ] **ADAPT-01**: Submission components use the existing design system (shadcn/ui, CVA, trained theme tokens)
- [ ] **ADAPT-02**: API layer uses the existing Supabase client (getSupabaseClient) and CoachGuard auth pattern
- [ ] **ADAPT-03**: Intake views are lazy-loaded consistent with other coach features

## Future Requirements

### Intake Enhancements

- **INTAKE-05**: Coach can search submissions by name or email
- **LINK-03**: Coach can unlink a submission from a client
- **LINK-04**: Submissions auto-match to clients by email address
- **DETAIL-06**: Coach can send an invite to a submission's email directly from detail view

## Out of Scope

| Feature | Reason |
|---------|--------|
| Client-facing intake form | Already live on marketing site |
| intake_submissions/intake_photos migrations | Tables already exist in Supabase |
| Separate auth context for dashboard | trained-app has Zustand authStore + CoachGuard |
| Submission search | Deferred to future -- filter tabs sufficient for v1.4 |
| Auto-match submissions to clients | Manual linking chosen for v1.4 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INTAKE-01 | Phase 7 | Pending |
| INTAKE-02 | Phase 8 | Pending |
| INTAKE-03 | Phase 8 | Pending |
| INTAKE-04 | Phase 8 | Pending |
| DETAIL-01 | Phase 9 | Pending |
| DETAIL-02 | Phase 9 | Pending |
| DETAIL-03 | Phase 9 | Pending |
| DETAIL-04 | Phase 9 | Pending |
| DETAIL-05 | Phase 9 | Pending |
| LINK-01 | Phase 10 | Pending |
| LINK-02 | Phase 10 | Pending |
| ADAPT-01 | Phase 8 | Pending |
| ADAPT-02 | Phase 7 | Pending |
| ADAPT-03 | Phase 7 | Pending |

**Coverage:**
- v1.4 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-02-08*
*Last updated: 2026-02-08 after roadmap creation*
