import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '../env'
import { tokenStore } from '../../auth/tokenStore'

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }

function baseURL() {
  if (!env) throw new Error('API client requires valid env')
  return `${env.apiBaseUrl}/api/v1`
}

export const api = axios.create({
  withCredentials: true,
  timeout: 15_000,
})

api.interceptors.request.use((config) => {
  config.baseURL = baseURL()
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const refreshClient = axios.create({
  withCredentials: true,
  timeout: 15_000,
})

let refreshing = false
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ error?: { code?: string } }>) => {
    const original = error.config as RetryConfig | undefined
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/signup') &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token: string) => {
              original.headers.Authorization = `Bearer ${token}`
              resolve(api(original))
            },
            reject,
          })
        })
      }
      refreshing = true
      try {
        refreshClient.defaults.baseURL = baseURL()
        const { data } = await refreshClient.post('/auth/refresh')
        const token = data.data.accessToken as string
        tokenStore.set(token)
        queue.forEach((p) => p.resolve(token))
        queue = []
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch (err) {
        queue.forEach((p) => p.reject(err))
        queue = []
        tokenStore.clear()
        return Promise.reject(error)
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return 'Cannot reach the server. Make sure the backend is running on port 5000.'
    }
    const data = err.response?.data as { error?: { message?: string } } | undefined
    return data?.error?.message ?? err.message
  }
  if (err instanceof Error) return err.message
  return 'Request failed'
}
