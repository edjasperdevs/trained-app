import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import '@fontsource-variable/inter'
import '@fontsource-variable/oswald'
import '@fontsource-variable/jetbrains-mono'
import './index.css'
import { initSentry, ErrorBoundary } from './lib/sentry'

// Initialize error tracking
initSentry()

// Theme migration: Remove legacy theme selection
// Users who had 'gyg' selected will now get Trained (the only theme)
const legacyTheme = localStorage.getItem('app-theme')
if (legacyTheme) {
  localStorage.removeItem('app-theme')
  // Also remove body class that ThemeProvider used to set
  document.body.classList.remove('theme-trained', 'theme-gyg')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<ErrorFallback />}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)

// Simple error fallback UI
function ErrorFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">😵</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Something went wrong</h1>
        <p className="text-text-secondary mb-6">
          The app encountered an error. Try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-text-on-primary font-bold rounded-xl hover:bg-primary-hover transition-colors"
        >
          Refresh App
        </button>
      </div>
    </div>
  )
}
