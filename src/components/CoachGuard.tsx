import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { isCoach } from '@/lib/supabase'
import { toast } from '@/stores/toastStore'

interface CoachGuardProps {
  children: React.ReactNode
}

export function CoachGuard({ children }: CoachGuardProps) {
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading')

  useEffect(() => {
    isCoach()
      .then(result => setStatus(result ? 'authorized' : 'unauthorized'))
      .catch(() => {
        toast.warning('Unable to verify coach access')
        setStatus('unauthorized')
      })
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthorized') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
