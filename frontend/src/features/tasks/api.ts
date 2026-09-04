import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PAGE_SIZE, type Difficulty, type ListingType, type TaskStatus } from '../../lib/constants'
import { api } from '../../lib/api/client'
import type { Task, TaskInsert } from '../../types/database'

export type TaskFilters = {
  q?: string
  listing_type?: ListingType | ''
  category_id?: string
  difficulty?: Difficulty | ''
  status?: TaskStatus | ''
  department_id?: string
  sort?: 'newest' | 'deadline' | 'budget_high' | 'rating' | ''
}

export function useTasks(filters: TaskFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['tasks', filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get('/tasks', {
        params: {
          page: pageParam,
          limit: PAGE_SIZE,
          status: filters.status || 'open',
          listing_type: filters.listing_type || undefined,
          category_id: filters.category_id || undefined,
          difficulty: filters.difficulty || undefined,
          department_id: filters.department_id || undefined,
          q: filters.q || undefined,
          sort: filters.sort || undefined,
        },
      })
      return data.data as Task[]
    },
    getNextPageParam: (last, _pages, lastPageParam) =>
      last.length < PAGE_SIZE ? undefined : lastPageParam + 1,
  })
}

export function useTask(taskId?: string) {
  return useQuery({
    queryKey: ['task', taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data } = await api.get(`/tasks/${taskId}`)
      return data.data as Task
    },
  })
}

export function useMyTasks(userId?: string) {
  return useQuery({
    queryKey: ['my-tasks', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await api.get('/tasks/mine')
      return data.data as Task[]
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TaskInsert & { poster_id: string }) => {
      const { poster_id: _p, ...body } = input
      const { data } = await api.post('/tasks', body)
      return data.data as Task
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tasks'] })
      void qc.invalidateQueries({ queryKey: ['my-tasks'] })
      void qc.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })
}

export function useSubmitWork() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, proofUrl }: { taskId: string; proofUrl?: string }) => {
      await api.post(`/tasks/${taskId}/submit`, { proof_url: proofUrl ?? null })
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['task', vars.taskId] })
      void qc.invalidateQueries({ queryKey: ['my-tasks'] })
    },
  })
}

export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.post(`/tasks/${taskId}/complete`)
    },
    onSuccess: (_d, taskId) => {
      void qc.invalidateQueries({ queryKey: ['task', taskId] })
      void qc.invalidateQueries({ queryKey: ['my-tasks'] })
      void qc.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })
}

export function useCancelTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, reason }: { taskId: string; reason?: string }) => {
      await api.post(`/tasks/${taskId}/cancel`, { reason })
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['task', vars.taskId] })
      void qc.invalidateQueries({ queryKey: ['my-tasks'] })
      void qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useCompleteOpenWorkshop() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.post(`/tasks/${taskId}/complete-workshop`)
    },
    onSuccess: (_d, taskId) => {
      void qc.invalidateQueries({ queryKey: ['task', taskId] })
      void qc.invalidateQueries({ queryKey: ['my-tasks'] })
      void qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
