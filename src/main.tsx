import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { initSentry, ErrorBoundary } from './lib/sentry'

// Initialize error tracking
initSentry()

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
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">😵</div>
        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-gray-400 mb-6">
          The app encountered an error. Try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-[#00f5d4] text-black font-bold rounded-xl hover:bg-[#00f5d4]/80 transition-colors"
        >
          Refresh App
        </button>
      </div>
    </div>
  )
}
