import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api/client'
import type { Profile, ProfileUpdate } from '../../types/database'

export function useProfile(id?: string) {
  return useQuery({
    queryKey: ['profile', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get(`/profiles/${id}`)
      return data.data as Profile
    },
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id: _id, patch }: { id: string; patch: ProfileUpdate }) => {
      const { data } = await api.patch('/profiles/me', patch)
      return data.data as Profile
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['profile', vars.id] })
    },
  })
}

export function useSetUserInterests() {
  return useMutation({
    mutationFn: async ({ userId, categoryIds }: { userId: string; categoryIds: string[] }) => {
      await api.put('/profiles/me/interests', { categoryIds })
      return { userId, categoryIds }
    },
  })
}
