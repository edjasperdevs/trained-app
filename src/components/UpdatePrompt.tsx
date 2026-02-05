import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom">
      <div className="bg-surface border border-border rounded-lg p-4 shadow-lg flex items-center justify-between gap-3">
        <p className="text-sm text-text-primary">
          A new version is available.
        </p>
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-4 py-2 bg-primary text-text-on-primary text-sm font-semibold rounded whitespace-nowrap"
        >
          Update
        </button>
      </div>
    </div>
  )
}
