import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { env } from '../lib/env'
import { api, getErrorMessage } from '../lib/api/client'
import { tokenStore } from './tokenStore'
import type { Profile } from '../types/database'
import { Spinner } from '../components/ui/Spinner'
import { AuthContext, type AuthContextValue, type SignUpInput } from './authContext'

export type { SignUpInput }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const applyAuth = useCallback((token: string, nextProfile: Profile) => {
    tokenStore.set(token)
    setAccessToken(token)
    setProfile(nextProfile)
  }, [])

  const clearAuth = useCallback(() => {
    tokenStore.clear()
    setAccessToken(null)
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    const { data } = await api.get('/auth/me')
    setProfile(data.data as Profile)
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await api.post('/auth/refresh')
        const token = data.data.accessToken as string
        tokenStore.set(token)
        const me = await api.get('/auth/me')
        if (!mounted) return
        setAccessToken(token)
        setProfile(me.data.data as Profile)
      } catch {
        if (mounted) clearAuth()
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [clearAuth])

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const domain = env?.allowedEmailDomain ?? 'thapar.edu'
      const email = input.email.trim().toLowerCase()
      if (!email.endsWith(`@${domain}`)) {
        return { error: `Email must end with @${domain}` }
      }
      try {
        const { data } = await api.post('/auth/signup', {
          ...input,
          email,
          year_of_study: input.year_of_study,
        })
        applyAuth(data.data.accessToken, data.data.profile)
        return { error: null }
      } catch (e) {
        return { error: getErrorMessage(e) }
      }
    },
    [applyAuth],
  )

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const { data } = await api.post('/auth/login', {
          email: email.trim().toLowerCase(),
          password,
        })
        applyAuth(data.data.accessToken, data.data.profile)
        return { error: null }
      } catch (e) {
        return { error: getErrorMessage(e) }
      }
    },
    [applyAuth],
  )

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    }
    clearAuth()
  }, [clearAuth])

  const value = useMemo<AuthContextValue>(
    () => ({
      session: accessToken ? { accessToken } : null,
      user: profile ? { id: profile.id, email: profile.college_email } : null,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      refreshProfile,
    }),
    [accessToken, profile, loading, signUp, signIn, signOut, refreshProfile],
  )

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
