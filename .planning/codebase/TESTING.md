# Testing Patterns

**Analysis Date:** 2026-02-04

## Test Framework

**Runner:**
- Vitest 1.6.0
- Config: `vite.config.ts` contains test configuration
- Environment: jsdom (browser environment simulation)
- Globals: enabled (describe, it, expect available without imports)

**Assertion Library:**
- Vitest built-in expect
- @testing-library/jest-dom (^6.9.1) for DOM matchers

**Run Commands:**
```bash
npm run test              # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Run tests with coverage report
```

## Test File Organization

**Location:**
- Co-located with source files (same directory)
- Test files: `src/**/*.test.ts`, `src/**/*.test.tsx`, `src/**/*.spec.ts`, `src/**/*.spec.tsx`
- Setup file: `src/test/setup.ts` (runs before all tests)
- Utilities: `src/test/utils.tsx` (custom render function and helpers)

**Naming:**
- Pattern: `ComponentName.test.tsx` or `storeName.test.ts`
- Examples:
  - `src/components/Button.test.tsx` (component test)
  - `src/stores/workoutStore.test.ts` (store test)
  - `src/components/Card.test.tsx` (component test)

**Test Count:**
- 6 test files in codebase
- Located in:
  - Stores: `workoutStore.test.ts`, `xpStore.test.ts`, `macroStore.test.ts`
  - Components: `Button.test.tsx`, `Card.test.tsx`, `ProgressBar.test.tsx`

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '../test/utils'
import { Button } from './Button'

describe('Button', () => {
  // Optional beforeEach setup
  beforeEach(() => {
    // Reset state or mocks
  })

  // Grouped tests by functionality
  describe('Rendering', () => {
    it('should render children text', () => {
      render(<Button>Click Me</Button>)
      expect(screen.getByText('Click Me')).toBeInTheDocument()
    })
  })

  // Individual test cases
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click Me</Button>)
    fireEvent.click(screen.getByText('Click Me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

**Patterns:**

1. **Import pattern:**
   - Vitest functions: `import { describe, it, expect, beforeEach, vi } from 'vitest'`
   - Testing Library: `import { render, screen, fireEvent } from '../test/utils'`
   - Custom render from `src/test/utils.tsx` (not directly from @testing-library/react)

2. **Setup pattern:**
   - `beforeEach(() => { ... })` to reset state before each test
   - For stores: `useStore.setState({ ...initialState })`
   - For mocks: `vi.clearAllMocks()`

3. **Teardown pattern:**
   - No explicit teardown (uses beforeEach reset instead)
   - Store state reset in beforeEach
   - Mock clearing in global setup

4. **Assertion pattern:**
   - Direct expectation: `expect(value).toBe(expected)`
   - DOM queries: `expect(screen.getByText('text')).toBeInTheDocument()`
   - Call verification: `expect(mockFn).toHaveBeenCalledTimes(1)`
   - State verification for stores: `expect(useStore.getState().property).toEqual(value)`

## Mocking

**Framework:**
- Vitest's `vi` module for mocking functions and modules
- No additional mocking library (uses built-in capabilities)

**Patterns:**

**Function Mocks:**
```typescript
const handleClick = vi.fn()
render(<Button onClick={handleClick}>Click</Button>)
fireEvent.click(screen.getByText('Click'))
expect(handleClick).toHaveBeenCalledTimes(1)
```

**Setup File Mocks (`src/test/setup.ts`):**
```typescript
// localStorage mock
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Browser API mocks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    // ...
  }))
})

// Global mocks
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

window.scrollTo = vi.fn()
```

**What to Mock:**
- Event handlers (onClick, onChange, etc.)
- Third-party API calls (only in integration tests, not mocked by default)
- Browser APIs (localStorage, matchMedia, ResizeObserver, IntersectionObserver)
- Store functions when testing components in isolation

**What NOT to Mock:**
- Component internals (test behavior, not implementation)
- Store state management (test stores directly with their actual logic)
- React hooks from React library (use actual hooks)
- Child components (unless testing parent-child communication)

## Fixtures and Factories

**Test Data:**

**Store Fixtures (reset before each test):**
```typescript
beforeEach(() => {
  useWorkoutStore.setState({
    currentPlan: null,
    workoutLogs: [],
    currentWeek: 1,
    customizations: []
  })
})
```

**Test Data Objects:**
```typescript
// From workoutStore.test.ts
const workoutId = useWorkoutStore.getState().startWorkout('push', 1)
const exerciseId = useWorkoutStore.getState().workoutLogs[0].exercises[0].id
```

**Inline Data Creation:**
```typescript
// From macroStore.test.ts
calculateMacros(180, 70, 30, 'male', 'cut', 'moderate')

// From xpStore.test.ts
const total = logDailyXP({
  date: '2024-01-15',
  workout: true,
  protein: false,
  calories: false,
  checkIn: false,
  perfectDay: false,
  streakBonus: 0
})
```

**Location:**
- Test data defined inline in test cases (no separate fixture files)
- Factory methods are store action calls: `store.startWorkout()`, `store.logSet()`
- Stores act as data generators for complex objects

## Coverage

**Requirements:**
- Not strictly enforced (no coverage threshold configured)
- Coverage reporter configured: `reporter: ['text', 'json', 'html']`

**View Coverage:**
```bash
npm run test:coverage
```

**Coverage output:**
- Text format (console)
- JSON format (for CI/CD)
- HTML format (for detailed inspection in browser)

**Excluded from coverage:**
- `node_modules/`
- `src/test/` (setup and utilities)

**Current Coverage:**
- 6 test files targeting: stores (3), components (3)
- Coverage is selective, not comprehensive (some components/stores untested)

## Test Types

**Unit Tests:**
- **Scope:** Individual store functions and component behaviors
- **Approach:** Test store actions and their state mutations
- **Examples:**
  - Store tests: `workoutStore.test.ts` tests individual actions like `setPlan()`, `startWorkout()`, `logSet()`
  - Component tests: `Button.test.tsx` tests rendering, click handlers, prop application

**Integration Tests:**
- **Scope:** Not explicitly labeled, but multi-step tests exist
- **Approach:** Test multiple store actions in sequence
- **Examples from `workoutStore.test.ts`:**
```typescript
beforeEach(() => {
  useWorkoutStore.getState().setPlan(5)
  workoutId = useWorkoutStore.getState().startWorkout('push', 1)
  exerciseId = useWorkoutStore.getState().workoutLogs[0].exercises[0].id
})

it('should update weight for a set', () => {
  // Tests logSet action which depends on prior setPlan and startWorkout
  const { logSet } = useWorkoutStore.getState()
  logSet(workoutId, exerciseId, 0, { weight: 135 })
  expect(workout.exercises[0].sets[0].weight).toBe(135)
})
```

**E2E Tests:**
- Not used in codebase
- No Playwright, Cypress, or Selenium configured

## Common Patterns

**Async Testing:**

React component testing with async operations:
```typescript
// From src/test/utils.tsx
export function waitForStateUpdate() {
  return new Promise(resolve => setTimeout(resolve, 0))
}
```

Store async actions (example pattern from authStore):
```typescript
// In tests, async actions are awaited
const result = await useAuthStore.getState().signUp('email@example.com', 'password')
expect(result.error).toBeNull()
```

**Error Testing:**

Testing error handling in stores:
```typescript
it('should return error when service unavailable', () => {
  const { signUp } = useAuthStore.getState()

  // When supabase is not configured
  const result = useAuthStore.getState().signUp('test@test.com', 'pass')
  expect(result.error).toBe('Backend not configured')
})
```

Negative cases for store logic:
```typescript
// From macroStore.test.ts
it('should not generate meal plan without targets', () => {
  const { generateMealPlan } = useMacroStore.getState()
  generateMealPlan()
  const { mealPlan } = useMacroStore.getState()
  expect(mealPlan).toHaveLength(0) // No plan generated
})
```

**DOM Testing Patterns:**

Getting elements:
```typescript
screen.getByText('Button text')           // Exact text match
screen.getByRole('button')                 // By ARIA role
screen.getByRole('button', { name: /xxx/ }) // By role and name
```

Firing events:
```typescript
fireEvent.click(element)
fireEvent.change(input, { target: { value: 'new value' } })
```

Verifying DOM state:
```typescript
expect(screen.getByText('text')).toBeInTheDocument()
expect(button.className).toContain('expected-class')
expect(button).toHaveAttribute('type', 'submit')
expect(button).toHaveAttribute('disabled')
```

## Custom Test Utilities

**Custom Render (`src/test/utils.tsx`):**

Wraps components with necessary providers:
```typescript
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <BrowserRouter>{children}</BrowserRouter>
    ),
    ...options
  })
}

export { customRender as render }
export * from '@testing-library/react'
```

**Helper Functions:**

Mock date for time-dependent tests:
```typescript
export function mockDate(date: string | Date) {
  const mockDateObj = new Date(date)
  vi.setSystemTime(mockDateObj)
  return mockDateObj
}
```

Reset stores between tests:
```typescript
export function resetStore<T>(useStore: { setState: (state: T) => void }) {
  if (useStore.getInitialState) {
    useStore.setState(useStore.getInitialState())
  }
}
```

## Running Tests

**Watch Mode:**
```bash
npm run test
```
- Reruns tests when files change
- Interactive mode

**Run Once:**
```bash
npm run test:run
```
- Single test run
- Good for CI/CD pipelines

**Coverage Report:**
```bash
npm run test:coverage
```
- Generates coverage in text, JSON, and HTML formats
- HTML report: check `coverage/` directory

## Test Organization by Type

**Store Tests:**
- File: `src/stores/storeName.test.ts`
- Pattern: Test store state and actions
- Reset state in `beforeEach`
- Get state with `useStore.getState()`
- Examples:
  - `src/stores/workoutStore.test.ts` (378 lines, 40+ test cases)
  - `src/stores/xpStore.test.ts` (100+ lines)
  - `src/stores/macroStore.test.ts` (100+ lines)

**Component Tests:**
- File: `src/components/ComponentName.test.tsx`
- Pattern: Test rendering and user interactions
- Use custom `render()` from `src/test/utils.tsx`
- Mock event handlers with `vi.fn()`
- Examples:
  - `src/components/Button.test.tsx` (95 lines, 13 test cases)
  - `src/components/Card.test.tsx` (93 lines, 13 test cases)
  - `src/components/ProgressBar.test.tsx` (similar structure)

## Vitest Configuration

**From `vite.config.ts`:**
```typescript
test: {
  globals: true,                      // describe, it, expect are global
  environment: 'jsdom',               // Browser environment
  setupFiles: ['./src/test/setup.ts'], // Setup runs before tests
  include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  coverage: {
    reporter: ['text', 'json', 'html'],
    exclude: ['node_modules/', 'src/test/']
  }
}
```

---

*Testing analysis: 2026-02-04*
