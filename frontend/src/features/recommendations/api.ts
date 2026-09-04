import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api/client'
import type { Task } from '../../types/database'

export function useRecommendations(enabled = true) {
  return useQuery({
    queryKey: ['recommendations'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get('/recommendations', { params: { limit: 12 } })
      return data.data as Task[]
    },
  })
}
