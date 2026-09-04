import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api/client'
import type { Application } from '../../types/database'

export function useApplyToTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { task_id: string; applicant_id: string; message?: string }) => {
      const { data } = await api.post('/applications', {
        task_id: input.task_id,
        message: input.message,
      })
      return data.data as Application
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['applications', vars.task_id] })
      void qc.invalidateQueries({ queryKey: ['my-application', vars.task_id] })
    },
  })
}

export function useTaskApplications(taskId?: string) {
  return useQuery({
    queryKey: ['applications', taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data } = await api.get(`/applications/task/${taskId}`)
      return data.data as Application[]
    },
  })
}

export function useMyApplication(taskId?: string, userId?: string) {
  return useQuery({
    queryKey: ['my-application', taskId, userId],
    enabled: !!taskId && !!userId,
    queryFn: async () => {
      const { data } = await api.get(`/applications/mine/${taskId}`)
      return data.data as Application | null
    },
  })
}

export function useAcceptApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (applicationId: string) => {
      await api.post(`/applications/${applicationId}/accept`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['applications'] })
      void qc.invalidateQueries({ queryKey: ['task'] })
      void qc.invalidateQueries({ queryKey: ['my-tasks'] })
    },
  })
}

export function useRejectApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (applicationId: string) => {
      await api.post(`/applications/${applicationId}/reject`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}
