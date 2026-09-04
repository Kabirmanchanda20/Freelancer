import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api/client'
import type { Dispute, Review } from '../../types/database'

export function useRaiseDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, reason }: { taskId: string; reason: string }) => {
      const { data } = await api.post('/disputes', { task_id: taskId, reason })
      return data.data.id as string
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['task', vars.taskId] })
      void qc.invalidateQueries({ queryKey: ['disputes'] })
    },
  })
}

export function useResolveDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      disputeId,
      resolution,
      action,
    }: {
      disputeId: string
      resolution: string
      action: 'complete' | 'cancel'
    }) => {
      await api.post(`/disputes/${disputeId}/resolve`, { resolution, action })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['disputes'] })
      void qc.invalidateQueries({ queryKey: ['task'] })
      void qc.invalidateQueries({ queryKey: ['my-tasks'] })
    },
  })
}

export function useOpenDisputes() {
  return useQuery({
    queryKey: ['disputes', 'open'],
    queryFn: async () => {
      const { data } = await api.get('/disputes/open')
      return data.data as Dispute[]
    },
  })
}

export function useCreateReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      taskId: string
      revieweeId: string
      stars: number
      comment?: string
    }) => {
      const { data } = await api.post('/reviews', {
        task_id: input.taskId,
        reviewee_id: input.revieweeId,
        stars: input.stars,
        comment: input.comment,
      })
      return data.data.id as string
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['reviews', vars.taskId] })
      void qc.invalidateQueries({ queryKey: ['profile', vars.revieweeId] })
    },
  })
}

export function useTaskReviews(taskId?: string) {
  return useQuery({
    queryKey: ['reviews', taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data } = await api.get(`/reviews/task/${taskId}`)
      return data.data as Review[]
    },
  })
}
