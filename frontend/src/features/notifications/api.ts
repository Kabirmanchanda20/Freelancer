import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api/client'
import type { Notification } from '../../types/database'

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ['notifications'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get('/notifications')
      return data.data as Notification[]
    },
  })
}

export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get('/notifications/unread-count')
      return data.data.count as number
    },
    refetchInterval: 15_000,
  })
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all')
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
