import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
// Custom render that includes all required providers
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

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Import vi for mockDate helper
import { vi } from 'vitest'

// Helper to create a mock date
export function mockDate(date: string | Date) {
  const mockDateObj = new Date(date)
  vi.setSystemTime(mockDateObj)
  return mockDateObj
}

// Helper to reset Zustand stores between tests
export function resetStore<T>(useStore: { setState: (state: T) => void; getInitialState?: () => T }) {
  if (useStore.getInitialState) {
    useStore.setState(useStore.getInitialState())
  }
}

// Helper to wait for state updates
export function waitForStateUpdate() {
  return new Promise(resolve => setTimeout(resolve, 0))
}
