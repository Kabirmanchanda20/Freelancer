import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from './useAuth'

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!profile?.is_admin) {
    return <Navigate to="/feed" replace />
  }

  return children
}
