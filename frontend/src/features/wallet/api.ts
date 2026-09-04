import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api/client'

export type WalletTx = {
  id: string
  task_id: string | null
  from_user: string | null
  to_user: string | null
  amount: number
  type: string
  created_at: string
}

export function useWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const { data } = await api.get('/wallet/me')
      return data.data as { balance: number; transactions: WalletTx[] }
    },
  })
}
