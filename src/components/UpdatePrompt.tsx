import { useRegisterSW } from 'virtual:pwa-register/react'
import { isNative } from '@/lib/platform'

/** Inner component -- only mounts on web. Contains the useRegisterSW hook. */
function WebUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-32 left-4 right-4 z-50 animate-in slide-in-from-bottom">
      <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-base font-semibold text-foreground">
              New Look Available
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              We've refreshed the design for a premium experience.
            </p>
          </div>
          <button
            onClick={() => updateServiceWorker(true)}
            className="w-full px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded uppercase tracking-wide"
          >
            Update Now
          </button>
        </div>
      </div>
    </div>
  )
}

/** Service workers don't exist in WKWebView -- skip entirely on native. */
export function UpdatePrompt() {
  if (isNative()) return null
  return <WebUpdatePrompt />
}
