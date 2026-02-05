import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from '@/stores'

export function NotFound() {
  useEffect(() => {
    toast.info('Page not found — redirected to home')
  }, [])

  return <Navigate to="/" replace />
}
