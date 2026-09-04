import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api/client'
import type { Category, Department } from '../../types/database'

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await api.get('/catalog/departments')
      return data.data as Department[]
    },
    staleTime: 5 * 60_000,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/catalog/categories')
      return data.data as Category[]
    },
    staleTime: 5 * 60_000,
  })
}
