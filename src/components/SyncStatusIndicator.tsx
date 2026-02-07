import { useSyncStore } from '@/stores/syncStore'
import { Cloud, CloudOff, Loader2, AlertTriangle } from 'lucide-react'

export function SyncStatusIndicator() {
  const status = useSyncStore((s) => s.status)
  const pendingChanges = useSyncStore((s) => s.pendingChanges)

  // Don't show anything when fully synced with no pending changes
  if (status === 'synced' && !pendingChanges) return null

  const config = {
    syncing: {
      icon: Loader2,
      label: 'Syncing...',
      className: 'text-muted-foreground bg-card',
      animate: true,
    },
    offline: {
      icon: CloudOff,
      label: 'Offline',
      className: 'text-warning bg-warning/10',
      animate: false,
    },
    error: {
      icon: AlertTriangle,
      label: 'Sync failed',
      className: 'text-destructive bg-destructive/10',
      animate: false,
    },
    synced: {
      // Only shown when synced but pendingChanges is true (edge case)
      icon: Cloud,
      label: 'Pending sync',
      className: 'text-muted-foreground bg-card',
      animate: false,
    },
  }

  const { icon: Icon, label, className, animate } = config[status]

  return (
    <div
      className={`fixed bottom-[72px] left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border border-border ${className}`}
    >
      <Icon size={14} className={animate ? 'animate-spin' : ''} />
      <span>{label}</span>
    </div>
  )
}
