import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api/client'
import type { Message } from '../../types/database'

export function useTaskMessages(taskId?: string) {
  return useQuery({
    queryKey: ['messages', taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data } = await api.get(`/messages/task/${taskId}`)
      return data.data as Message[]
    },
    refetchInterval: 3000,
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { task_id: string; sender_id: string; content: string }) => {
      const { data } = await api.post('/messages', {
        task_id: input.task_id,
        content: input.content,
      })
      return data.data as Message
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['messages', vars.task_id] })
    },
  })
}

export function useInbox() {
  return useQuery({
    queryKey: ['inbox'],
    queryFn: async () => {
      const { data } = await api.get('/messages/inbox')
      return data.data as Array<{
        task_id: string
        title: string
        status: string
        last_message: string
        last_at: string
      }>
    },
    refetchInterval: 3000,
  })
}
