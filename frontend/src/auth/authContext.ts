import { createContext } from 'react'
import type { CampusRole, Difficulty } from '../lib/constants'
import type { Profile } from '../types/database'

export type SignUpInput = {
  email: string
  password: string
  full_name: string
  campus_role: CampusRole
  department_id?: string
  roll_or_employee_id?: string
  program?: string
  year_of_study?: number
  designation?: string
  experience_level?: Difficulty
}

export type AuthContextValue = {
  session: { accessToken: string } | null
  user: { id: string; email: string } | null
  profile: Profile | null
  loading: boolean
  signUp: (input: SignUpInput) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
