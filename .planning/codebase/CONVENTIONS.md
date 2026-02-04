# Coding Conventions

**Analysis Date:** 2026-02-04

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `Button.tsx`, `Card.tsx`, `Avatar.tsx`)
- Stores: camelCase with "Store" suffix (e.g., `workoutStore.ts`, `authStore.ts`, `userStore.ts`)
- Hooks: camelCase with "use" prefix (e.g., `useClientDetails.ts`)
- Screens: PascalCase (e.g., `Home.tsx`, `Settings.tsx`, `Workouts.tsx`)
- Utilities/lib: camelCase (e.g., `supabase.ts`, `sync.ts`, `analytics.ts`)
- Test files: mirror source with `.test.ts` or `.spec.tsx` suffix (e.g., `Button.test.tsx`, `workoutStore.test.ts`)

**Functions:**
- Component functions: PascalCase (e.g., `export function Button()`, `export function Card()`)
- Helper/utility functions: camelCase (e.g., `isCacheValid()`, `getCache()`, `fetchClientWeight()`)
- Store actions: camelCase (e.g., `setPlan()`, `logSet()`, `startWorkout()`)
- React hooks: camelCase with "use" prefix (e.g., `useEffect()`, `useState()`, `useCallback()`)

**Variables:**
- State variables: camelCase (e.g., `currentPlan`, `workoutLogs`, `isLoading`)
- Constants: UPPER_SNAKE_CASE for module-level constants (e.g., `CACHE_TTL`, `XP_VALUES`)
- Boolean variables: prefixed with "is", "has", "can" (e.g., `isLoading`, `hasCheckedInToday`, `canClaimXP`)

**Types:**
- Interfaces: PascalCase (e.g., `CardProps`, `ButtonProps`, `BadgeRarity`, `WorkoutStore`)
- Type aliases: PascalCase (e.g., `WorkoutType`, `DayOfWeek`, `BadgeRarity`)
- Union types: PascalCase (e.g., `'push' | 'pull' | 'legs'`)

## Code Style

**Formatting:**
- No explicit formatter detected in config (prettier/eslint not found)
- Uses consistent spacing with 2-space indentation
- Template literals for conditional class names (see Button.tsx, Card.tsx)
- Classes combined with template string interpolation: `${className} ${conditionalClass}`

**Linting:**
- Tool: ESLint (^9.9.1)
- Config: Appears to use default ESLint setup
- Plugins: `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- Runs with `npm run lint`

**Line length:** No strict limit enforced (files contain longer lines with template literals)

## Import Organization

**Order:**
1. React and React ecosystem (react, react-dom, react-router-dom)
2. Third-party libraries (zustand, framer-motion, lucide-react, @supabase/supabase-js)
3. Relative imports from project (`@/components`, `@/stores`, `@/lib`, `@/themes`)
4. Type imports (often inline with imports or separate type statements)

**Path Aliases:**
- `@/*` → `src/*` (defined in `tsconfig.json`)
- Example: `import { Button } from '@/components'`
- Example: `import { useWorkoutStore } from '@/stores'`
- Example: `import type { XPSource } from '@/lib/database.types'`

**Barrel Files:**
- Components: `src/components/index.ts` exports all components
- Stores: `src/stores/index.ts` exports all stores and their types
- Screens: `src/screens/index.ts` exports screens
- Themes: `src/themes/index.ts` provides theme context and hooks

## Error Handling

**Patterns:**
- Try-catch blocks for async operations (e.g., `authStore.ts`, `useClientDetails.ts`)
- Inline error tracking with variables (e.g., `const [error, setError] = useState<string | null>(null)`)
- Null coalescing for default values (e.g., `data.user ?? null`, `error.message ?? 'Unknown error'`)
- Graceful degradation with return objects: `{ error: string | null }` pattern
- Example in `authStore.ts`:
```typescript
try {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) {
    return { error: error.message }
  }
  // process success
  return { error: null }
} catch (error) {
  console.error('Error message:', error)
  return { error: 'Fallback message' }
}
```

## Logging

**Framework:** console (native)

**Patterns:**
- `console.error()` for errors: `console.error('Auth initialization error:', error)`
- `console.log()` for debug info: `console.log('[Analytics]', event, props)`
- `console.warn()` for warnings: `console.warn('USDA API failed, falling back...')`
- Namespace prefixing with brackets for clarity: `[Analytics]`, `[Sentry]`, `[Access]`
- Most logging found in: stores, hooks, and lib files
- Very minimal logging in UI components

**Found in:**
- `src/stores/authStore.ts`: Error logging during initialization
- `src/stores/accessStore.ts`: Access control logging with `[Access]` prefix
- `src/lib/analytics.ts`: Event tracking with `[Analytics]` prefix
- `src/lib/sentry.ts`: Error reporting with `[Sentry]` prefix
- `src/hooks/useClientDetails.ts`: Error logging in data fetching

## Comments

**When to Comment:**
- Section headers for logical groupings (e.g., "// Actions" in store interfaces)
- Category comments for badge definitions (e.g., "// Streak badges", "// Workout badges")
- Explaining non-obvious logic (e.g., cache validation, conditional rendering)
- TODO/FIXME comments not frequently used

**JSDoc/TSDoc:**
- Not widely used in source code
- Type safety is preferred over JSDoc annotations (strict TypeScript mode enabled)
- Function signatures and interfaces are self-documenting
- Comments focus on "why" not "what" (types already show what)

**Example from `src/hooks/useClientDetails.ts`:**
```typescript
function isCacheValid(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < CACHE_TTL
}

// Section comment explaining the fetch function
const fetchClientWeight = useCallback(async (id: string, days: number = 30): Promise<WeightData[]> => {
```

## Function Design

**Size:** Generally compact, 5-50 lines per function

**Parameters:**
- Use destructuring in function signatures for component props
- Example: `{ children, onClick, variant = 'primary', size = 'md', ... }`
- Default parameters common for optional values: `days: number = 30`
- Type-safe with explicit parameter types

**Return Values:**
- Components return JSX (React.ReactElement or ReactNode wrapper)
- Store actions return data or void
- Async functions return Promises
- Error-handling functions return `{ error: string | null }`
- Example: `const fetchAll = useCallback(async (id: string) => { ... }, [deps])`

## Module Design

**Exports:**
- Named exports preferred: `export function Button() { ... }`
- Component and store modules export both implementation and types
- Example from `src/stores/index.ts`:
```typescript
export { useUserStore } from './userStore'
export type { UserProfile, FitnessLevel, TrainingDays, ... } from './userStore'
```

**Barrel Files:**
- Re-export all public APIs from index files
- Components: `src/components/index.ts` exports component functions
- Stores: `src/stores/index.ts` exports stores and their types
- Screens: `src/screens/index.ts` re-exports screen components
- Makes importing cleaner: `import { Button, Card } from '@/components'`

## TypeScript Configuration

**Strict Mode:**
- Enabled: `"strict": true`
- `"noUnusedLocals": true` - Unused variables cause errors
- `"noUnusedParameters": true` - Unused parameters cause errors
- `"noFallthroughCasesInSwitch": true` - Switch cases must have breaks
- Target: `ES2020`
- JSX: `"react-jsx"` (automatic JSX transform)

**Path Resolution:**
- `"moduleResolution": "bundler"`
- `"baseUrl": "."` with `"@/*": ["src/*"]`
- Allows clean import paths throughout codebase

## Component Pattern

**React Functional Components:**
- Function declaration syntax: `export function ComponentName(props: PropsInterface) { ... }`
- Props interface: Separate `interface ComponentProps { ... }` with clear property documentation
- Default values in destructuring: `{ variant = 'primary', size = 'md' }`
- Hooks at top of component (React rules of hooks)
- Template literal for class composition: `className={`${baseClass} ${conditionalClass}`}`

**Example from `src/components/Button.tsx`:**
```typescript
interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  ...
}: ButtonProps) {
  // Hook calls
  const { themeId } = useTheme()

  // Render logic
  return <motion.button ...>
}
```

## Store Pattern (Zustand)

**Store Definition:**
- Interface for store state and actions
- Create store with `create<StoreType>((set, get) => ({ ... }))`
- Use `persist` middleware for local storage: `create<T>(persist((set, get) => ({ ... }), { name: 'store-key' }))`
- Actions use `set()` to update state and `get()` to read state

**Example from `src/stores/workoutStore.ts`:**
```typescript
interface WorkoutStore {
  currentPlan: WorkoutPlan | null
  workoutLogs: WorkoutLog[]

  // Actions
  setPlan: (trainingDays: TrainingDays, selectedDays?: DayOfWeek[]) => void
  startWorkout: (type: WorkoutType, dayNumber: number) => string
}

export const useWorkoutStore = create<WorkoutStore>(
  persist((set, get) => ({
    currentPlan: null,
    workoutLogs: [],

    setPlan: (trainingDays, selectedDays) => {
      set({ currentPlan: { trainingDays, selectedDays, ... } })
    }
  }), { name: 'workout-store' })
)
```

**Test Patterns for Stores:**
- Reset store state before each test: `useStore.setState({ ...initialState })`
- Get state with: `useStore.getState()`
- Call actions: `useStore.getState().actionName()`
- Verify state after action: `expect(useStore.getState().property).toBe(value)`

## Conditional Rendering

**Patterns:**
- Ternary operators for simple conditions
- Early returns for guard clauses
- Logical AND (`&&`) for optional rendering
- Avoid complex nested ternaries

**Class Composition:**
- Template literals with variables for theme-aware styling:
```typescript
const getVariantClasses = () => {
  if (isTrained) {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-text-on-primary ...'
      // ...
    }
  } else {
    // GYG theme
  }
}

className={`${getVariantClasses()} ${sizeClasses[size]} ...`}
```

---

*Convention analysis: 2026-02-04*
