import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api/client'
import type { Profile } from '../../types/database'

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users')
      return data.data as Profile[]
    },
  })
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats')
      return data.data as {
        users: number
        tasks: number
        open_tasks: number
        open_disputes: number
        pending_applications: number
        escrow_held: number
        escrow_released: number
      }
    },
  })
}

export function useAdminSetSuspended() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, suspended }: { userId: string; suspended: boolean }) => {
      await api.post(`/admin/users/${userId}/suspend`, { suspended })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}
