# Phase 3: Client Roster - Research

**Researched:** 2026-02-07
**Domain:** Supabase server-side pagination/search + React paginated list UI
**Confidence:** HIGH

## Summary

Phase 3 transforms the existing monolithic Coach screen into a performant, paginated client roster with server-side search and a dedicated client detail view. The good news: significant infrastructure already exists. The `coach_client_summary` view provides at-a-glance data, `useClientDetails` hook fetches weight/macro/activity data with caching, and three coach-specific components (`WeightChart`, `ClientMacroAdherence`, `ClientActivityFeed`) are already built and wired into the Coach screen.

The primary work is: (1) replacing the current "fetch all clients, render in a flat list" pattern with server-side pagination using Supabase's `.range()` + `{ count: 'estimated' }`, (2) adding server-side search via `.or('username.ilike.%term%,email.ilike.%term%')` on the view query, (3) refactoring the client detail from a modal overlay into a proper drill-down view (or keeping it as a bottom sheet but ensuring it loads via the existing `useClientDetails` hook), and (4) updating the view to include macro adherence data so the roster card can show it at a glance.

**Primary recommendation:** Keep using the existing `coach_client_summary` view (not an RPC function) -- it is simpler, already works, and Supabase's PostgREST layer supports `.range()`, `.order()`, `.or()`, and `.ilike()` filtering directly on views. Add `security_invoker = true` to the view definition for proper RLS enforcement. The scale target is 90K clients; offset-based pagination with server-side `ilike` search handles this efficiently with proper indexes.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.93.3 | DB client, pagination, filtering | Already installed, typed |
| React | ^18.3.1 | UI rendering | Already installed |
| Tailwind CSS | ^4.1.18 | Styling | Already installed |
| Zustand | ^4.5.2 | State management (not needed for roster -- server-authoritative) | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | ^0.563.0 | Icons (Search, ChevronLeft, etc.) | Pagination controls, search input icon |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| View + `.range()` pagination | RPC function (`search_clients`) | RPC gives more control but adds complexity; view + PostgREST filters are sufficient for ilike search + pagination at 90K scale |
| `.ilike()` search | PostgreSQL full-text search (`tsvector`/`tsquery`) | FTS is faster for large text corpuses but overkill for name/email search on 90K rows; ilike with index is sub-millisecond |
| Offset pagination | Cursor-based (keyset) pagination | Cursor avoids "page drift" on live data but is much harder to implement "go to page N"; offset is fine when data changes infrequently (coach roster) |
| `useDeferredValue` for search | Manual `setTimeout` debounce (like FoodSearch) | The codebase already uses the setTimeout debounce pattern in FoodSearch; stay consistent |

**Installation:**
```bash
# No new dependencies needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── screens/
│   └── Coach.tsx              # Refactored: roster list + search + pagination
├── components/
│   ├── ClientCard.tsx          # NEW: extracted roster card (at-a-glance summary)
│   ├── ClientDetail.tsx        # NEW: extracted detail view (tabs: overview/progress/activity)
│   ├── ClientMacroAdherence.tsx  # EXISTS: macro adherence chart
│   ├── ClientActivityFeed.tsx    # EXISTS: activity timeline
│   └── WeightChart.tsx           # EXISTS: weight trend chart
├── hooks/
│   ├── useClientDetails.ts     # EXISTS: fetches weight/macro/activity for one client
│   └── useClientRoster.ts      # NEW: server-side paginated + searchable client list
└── lib/
    └── devSeed.ts              # EXISTS: needs mock pagination support
```

### Pattern 1: Server-Side Pagination via View + `.range()`
**What:** Query the `coach_client_summary` view with `.range(from, to)` and `{ count: 'estimated' }` to get a page of clients plus total count.
**When to use:** Every time the roster loads or the user changes page/search.
**Example:**
```typescript
// Source: Supabase official docs (range, select count)
const PAGE_SIZE = 20

async function fetchClientPage(page: number, search: string) {
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = getSupabaseClient()
    .from('coach_client_summary')
    .select('*', { count: 'estimated' })
    .order('username', { ascending: true, nullsFirst: false })

  if (search.trim()) {
    query = query.or(
      `username.ilike.%${search}%,email.ilike.%${search}%`
    )
  }

  const { data, count, error } = await query.range(from, to)
  return { clients: data || [], totalCount: count || 0, error }
}
```

### Pattern 2: Debounced Server-Side Search
**What:** Debounce the search input (300-400ms) before firing server query, matching the existing FoodSearch pattern.
**When to use:** When the coach types in the search box.
**Example:**
```typescript
// Matches existing pattern in FoodSearch.tsx
const debounceRef = useRef<NodeJS.Timeout | null>(null)

const handleSearchChange = (value: string) => {
  setSearch(value)
  if (debounceRef.current) clearTimeout(debounceRef.current)
  debounceRef.current = setTimeout(() => {
    setPage(0) // Reset to first page on new search
    fetchClients(0, value)
  }, 400)
}
```

### Pattern 3: Client Detail as Drill-Down (Not Separate Route)
**What:** Keep the client detail as a full-screen overlay/bottom sheet (current pattern), not a separate route like `/coach/client/:id`.
**When to use:** When a coach clicks a client card.
**Why:** The coach route is a single `/coach` route. Adding sub-routes requires react-router nested routes, which adds complexity. The current modal pattern works well on mobile and is already built. The `useClientDetails` hook handles data fetching and caching.

### Anti-Patterns to Avoid
- **Fetching all clients then filtering client-side:** INFRA-05 requires server-side pagination. The current `fetchClients()` does `.select('*')` with no pagination -- this fails at 100+ clients.
- **Using `.textSearch()` for name/email search:** Full-text search requires a `tsvector` column and GIN index. For simple name/email substring matching, `.ilike()` with `.or()` is simpler and fast enough.
- **Storing roster state in Zustand:** The roster is server-authoritative data. Local state (`useState`) is correct. Zustand persistence would show stale data.
- **Creating a separate RPC function when the view suffices:** The `coach_client_summary` view already joins all needed tables. PostgREST's `.range()` and `.or()` work on views. An RPC function would duplicate the view logic.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pagination | Custom LIMIT/OFFSET SQL | Supabase `.range(from, to)` + `{ count: 'estimated' }` | Handles bounds, returns count, typed |
| Multi-column search | Manual WHERE clause building | Supabase `.or('col1.ilike.%q%,col2.ilike.%q%')` | PostgREST handles escaping, SQL injection prevention |
| Debounce | Custom debounce utility | `setTimeout` ref pattern (matches FoodSearch) | Already proven in codebase, zero deps |
| Client detail data | New fetch functions | Existing `useClientDetails` hook | Already built with caching, error handling, race condition protection |

**Key insight:** The hardest parts of this phase are already built. The `useClientDetails` hook, `WeightChart`, `ClientMacroAdherence`, and `ClientActivityFeed` components exist and work. The main new code is pagination/search on the roster list.

## Common Pitfalls

### Pitfall 1: View Without `security_invoker`
**What goes wrong:** The current `coach_client_summary` view lacks `security_invoker = true`. PostgreSQL views are `security_definer` by default, meaning the view bypasses RLS on underlying tables. Any authenticated user querying the view would see all clients, not just the coach's clients.
**Why it happens:** The view was created without the `security_invoker` clause. In the single-coach scenario this hasn't been a security issue, but it violates the principle of defense in depth.
**How to avoid:** Add `security_invoker = true` to the view definition:
```sql
CREATE OR REPLACE VIEW coach_client_summary
WITH (security_invoker = true)
AS SELECT ...
```
This makes the view respect the RLS policies on `coach_clients`, `profiles`, `user_xp`, `weight_logs`, and `workout_logs`.
**Warning signs:** Supabase Dashboard security advisor flags this as lint `0010_security_definer_view`.

### Pitfall 2: Missing Index for `ilike` Search
**What goes wrong:** `ilike` on `username` and `email` columns does a sequential scan on the `profiles` table at 90K rows, causing slow search.
**Why it happens:** `ilike` with leading wildcard (`%term%`) cannot use a standard B-tree index. Only `ilike` with trailing wildcard (`term%`) can use B-tree.
**How to avoid:** For the 90K scale target, two options:
1. Use `pg_trgm` extension + GIN trigram index (handles `%term%` patterns efficiently)
2. Accept that `ilike` with `%term%` on 90K rows of short strings (names/emails) is fast enough (<10ms) without special indexing -- PostgreSQL benchmarks show sub-millisecond performance on 150K rows for short string ilike.
**Recommendation:** Start without trigram index. If search latency exceeds 100ms in production, add: `CREATE INDEX idx_profiles_username_trgm ON profiles USING gin (username gin_trgm_ops);`
**Warning signs:** Search response time > 200ms in network tab.

### Pitfall 3: Pagination "Off-by-One" with `.range()`
**What goes wrong:** Supabase `.range(from, to)` is inclusive on both ends. `range(0, 9)` returns 10 rows. Getting the math wrong results in missing rows or duplicates across pages.
**Why it happens:** Most pagination APIs use `(offset, limit)` but Supabase uses `(from, to)` inclusive.
**How to avoid:** Always calculate: `from = page * PAGE_SIZE`, `to = from + PAGE_SIZE - 1`.
**Warning signs:** First and last items on adjacent pages are the same, or items are missing between pages.

### Pitfall 4: View Subqueries Re-Execute Per Row
**What goes wrong:** The `coach_client_summary` view has correlated subqueries (`SELECT weight FROM weight_logs WHERE user_id = p.id ORDER BY date DESC LIMIT 1`). At 90K clients, these execute once per client row.
**Why it happens:** PostgreSQL's query planner handles correlated subqueries as nested loops by default.
**How to avoid:** This is mitigated by pagination -- only 20 subqueries execute per page, not 90K. The existing `idx_weight_logs_user_date` and `idx_workout_logs_user_date` indexes make each subquery an index-only scan. No action needed for the 20-per-page case.
**Warning signs:** Full table scans in `EXPLAIN ANALYZE` on the view query.

### Pitfall 5: Search Resets Page But Keeps Stale Count
**What goes wrong:** When the user types a search term, the page resets to 0 but the previous total count remains, showing incorrect pagination (e.g., "Page 1 of 50" when only 3 results match).
**Why it happens:** Count and data are fetched together, but if state update order is wrong, the UI flickers.
**How to avoid:** Always update `totalCount` and `clients` atomically from the same query response. Reset page to 0 before fetching with new search term.
**Warning signs:** Pagination shows wrong total pages momentarily during search.

## Code Examples

Verified patterns from official sources and existing codebase:

### Paginated Client Fetch with Search
```typescript
// Based on: Supabase .range() docs + .or() docs + existing Coach.tsx pattern
const PAGE_SIZE = 20

interface RosterState {
  clients: ClientSummary[]
  totalCount: number
  page: number
  search: string
  isLoading: boolean
  error: string | null
}

async function fetchRosterPage(
  page: number,
  search: string
): Promise<{ clients: ClientSummary[]; totalCount: number }> {
  if (devBypass) {
    // Filter mock clients by search, return paginated slice
    const filtered = getMockClients().filter(c =>
      !search.trim() ||
      c.username?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    )
    return {
      clients: filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
      totalCount: filtered.length,
    }
  }

  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = getSupabaseClient()
    .from('coach_client_summary')
    .select('*', { count: 'estimated' })
    .order('username', { ascending: true, nullsFirst: false })

  if (search.trim()) {
    query = query.or(
      `username.ilike.%${search}%,email.ilike.%${search}%`
    )
  }

  const { data, count, error } = await query.range(from, to)
  if (error) throw error

  return { clients: data || [], totalCount: count || 0 }
}
```

### Pagination Controls Component
```typescript
// Based on: existing Button component + existing design patterns
interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between py-4">
      <Button
        variant="ghost"
        size="sm"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
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
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  )
}
```

### View Migration with `security_invoker` and Macro Adherence
```sql
-- Migration: 004_roster_enhancements.sql
-- Adds security_invoker to view + macro adherence at-a-glance data

CREATE OR REPLACE VIEW coach_client_summary
WITH (security_invoker = true)
AS
SELECT
  cc.coach_id,
  cc.client_id,
  cc.status,
  p.username,
  p.email,
  p.current_streak,
  p.longest_streak,
  p.last_check_in_date,
  p.goal,
  p.onboarding_complete,
  ux.current_level,
  ux.total_xp,
  (SELECT weight FROM weight_logs wl
   WHERE wl.user_id = p.id ORDER BY date DESC LIMIT 1) as latest_weight,
  (SELECT date FROM weight_logs wl
   WHERE wl.user_id = p.id ORDER BY date DESC LIMIT 1) as latest_weight_date,
  (SELECT COUNT(*) FROM workout_logs wl
   WHERE wl.user_id = p.id AND wl.completed = true
   AND wl.date >= CURRENT_DATE - INTERVAL '7 days') as workouts_last_7_days
FROM coach_clients cc
JOIN profiles p ON p.id = cc.client_id
LEFT JOIN user_xp ux ON ux.user_id = p.id;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side filtering | Server-side `.or()` + `.ilike()` | Supabase JS v2 (2023) | No need for RPC for basic search |
| `{ count: 'exact' }` | `{ count: 'estimated' }` | Supabase docs guidance (2024) | Faster count for pagination UI |
| Views bypass RLS | `security_invoker = true` on views | PostgreSQL 15 / Supabase 2024 | Views respect RLS of underlying tables |
| Custom debounce hooks | setTimeout ref pattern | React 18 (2022) | Simpler, no dependency, matches codebase |

**Deprecated/outdated:**
- `supabase-js` v1 `.match()` method: replaced by typed `.eq()`, `.ilike()`, `.or()` in v2

## Open Questions

1. **Macro adherence in roster card at a glance**
   - What we know: Success criteria #1 says "macro adherence at a glance" on the roster card. The current `coach_client_summary` view does NOT include macro adherence data.
   - What's unclear: Adding a macro adherence computation (e.g., "protein hit rate last 7 days") to the view requires a subquery joining `daily_macro_logs` + `macro_targets`. This adds per-row computation cost.
   - Recommendation: Add a simple subquery to the view that counts days where protein >= 90% of target in last 7 days, divided by 7. This is lightweight (index-backed) and gives the coach a quick "5/7 days hit" number. Alternatively, show the existing `workouts_last_7_days` as the primary at-a-glance metric and defer macro adherence to the detail view. **Let the planner decide.**

2. **Client detail: modal vs route**
   - What we know: Currently the client detail is a modal/bottom sheet inside Coach.tsx. Success criteria #3 says "drill into a client."
   - What's unclear: Whether "drill into" implies a route change (URL reflects selected client) or just opening a panel/modal.
   - Recommendation: Keep the current modal/bottom sheet pattern. It works, the code exists, and adding routes adds complexity. If the user wants deep-linking to a specific client later, that's a separate feature.

3. **Sort order for roster**
   - What we know: Current code sorts by "needs attention" (most days since last check-in first). INFRA-05 mentions "server-side search and sort."
   - What's unclear: What sort options the coach wants (alphabetical, last active, streak, etc.).
   - Recommendation: Default sort by `username` ascending (alphabetical) which is the most natural for a roster. The current "needs attention" sort can be a second option. Server-side `.order()` supports any column.

## Sources

### Primary (HIGH confidence)
- Supabase official docs: [`.range()` API reference](https://supabase.com/docs/reference/javascript/range) -- pagination method signature and behavior
- Supabase official docs: [`.select()` with count](https://supabase.com/docs/reference/javascript/select) -- `{ count: 'estimated' }` for pagination totals
- Supabase official docs: [`.or()` filter](https://supabase.com/docs/reference/javascript/or) -- PostgREST syntax for multi-column search
- Supabase official docs: [Database Functions](https://supabase.com/docs/guides/database/functions) -- RPC function patterns and security
- Supabase official docs: [Security Advisors - security_definer_view](https://supabase.com/docs/guides/database/database-advisors?lint=0010_security_definer_view) -- view security best practices
- Existing codebase: `src/screens/Coach.tsx` -- current client list, detail modal, invite flow
- Existing codebase: `src/hooks/useClientDetails.ts` -- client detail data fetching with caching
- Existing codebase: `supabase/schema.sql` -- `coach_client_summary` view definition, RLS policies, indexes

### Secondary (MEDIUM confidence)
- [Supabase Pagination in React: The Complete Guide](https://makerkit.dev/blog/tutorials/pagination-supabase-react) -- patterns for offset pagination with React
- [Supabase Discussion #6778](https://github.com/orgs/supabase/discussions/6778) -- multi-column ilike search workaround with `.or()`

### Tertiary (LOW confidence)
- Search performance benchmarks (ilike 0.3ms on 150K rows) cited from community discussions -- needs validation with `EXPLAIN ANALYZE` on actual schema

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all tools already in the codebase
- Architecture: HIGH - existing view, RLS policies, and components cover 70% of the work; pagination/search are well-documented Supabase features
- Pitfalls: HIGH - security_invoker gap identified from official docs; pagination math verified against API docs; index concern documented with pragmatic recommendation

**What exists vs what's new:**

| Component | Status | Notes |
|-----------|--------|-------|
| `coach_client_summary` view | EXISTS | Needs `security_invoker`, possibly macro adherence column |
| RLS policies for coach access | EXISTS | Already grant SELECT on client tables |
| `useClientDetails` hook | EXISTS | Weight, macros, activity with caching |
| `WeightChart` component | EXISTS | Used in client detail |
| `ClientMacroAdherence` component | EXISTS | Used in client detail |
| `ClientActivityFeed` component | EXISTS | Used in client detail |
| Client detail modal UI | EXISTS | Tabs, overview, progress, activity -- all built |
| Mock data (devBypass) | EXISTS | `getMockClients()`, `getMockClientDetails()` |
| Server-side pagination | NEW | `.range()` + `{ count: 'estimated' }` on view query |
| Server-side search | NEW | `.or('username.ilike.%q%,email.ilike.%q%')` |
| Pagination UI controls | NEW | Previous/Next + page indicator |
| Search input in roster header | NEW | Debounced input, matches FoodSearch pattern |
| `useClientRoster` hook (optional) | NEW | Encapsulates pagination + search state |
| View migration (004) | NEW | `security_invoker`, optional macro adherence |

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable domain, no fast-moving changes expected)
