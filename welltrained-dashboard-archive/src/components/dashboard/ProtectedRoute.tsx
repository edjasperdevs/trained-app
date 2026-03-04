import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-trained-black flex items-center justify-center">
        <div className="text-trained-red text-2xl font-black tracking-widest animate-pulse">
          <span className="text-trained-text">WELL</span>
          <span className="text-trained-red">TRAINED</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/coach/login" replace />
  }

  return <Outlet />
}
