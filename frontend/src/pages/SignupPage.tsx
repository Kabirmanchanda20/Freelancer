import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useDepartments } from '../features/catalog/api'
import {
  CAMPUS_ROLES,
  CAMPUS_ROLE_LABELS,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  type CampusRole,
} from '../lib/constants'
import { env } from '../lib/env'
import { Button, FieldError, Input, Label, Select } from '../components/ui'

const SIGNUP_ROLES: CampusRole[] = ['ug_student', 'mtech', 'phd', 'faculty']

function buildSchema(domain: string) {
  return z.object({
    full_name: z.string().min(2, 'Name is required'),
    email: z
      .email()
      .refine((e) => e.toLowerCase().endsWith(`@${domain}`), `Email must end with @${domain}`),
    password: z.string().min(8, 'At least 8 characters'),
    campus_role: z.enum(CAMPUS_ROLES),
    department_id: z.string().optional(),
    roll_or_employee_id: z.string().optional(),
    program: z.string().optional(),
    year_of_study: z.string().optional(),
    designation: z.string().optional(),
    experience_level: z.enum(DIFFICULTIES),
  })
}

export function SignupPage() {
  const { signUp, session, loading } = useAuth()
  const navigate = useNavigate()
  const { data: departments = [] } = useDepartments()
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const domain = env?.allowedEmailDomain ?? 'thapar.edu'
  const schema = useMemo(() => buildSchema(domain), [domain])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      campus_role: 'ug_student' as const,
      experience_level: 'beginner' as const,
      department_id: '',
      year_of_study: '',
      full_name: '',
      email: '',
      password: '',
    },
  })

  const role = watch('campus_role') as CampusRole
  const yearLabel = role === 'mtech' ? 'Year (1-2)' : role === 'phd' ? 'Year (1-3)' : 'Year (1-4)'

  if (!loading && session) {
    return <Navigate to="/onboarding" replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    if (!values.department_id) {
      setFormError('Please select your department')
      return
    }

    const yearRaw = values.year_of_study?.trim()
    const year = yearRaw ? Number(yearRaw) : undefined
    const needsYear = ['ug_student', 'mtech', 'phd'].includes(values.campus_role)
    const maxYear =
      values.campus_role === 'ug_student' ? 4 : values.campus_role === 'mtech' ? 2 : values.campus_role === 'phd' ? 3 : 0

    if (needsYear && !yearRaw) {
      setFormError('Please enter your current year')
      return
    }

    if (needsYear && (Number.isNaN(year) || year! < 1 || year! > maxYear)) {
      setFormError(`Year must be between 1 and ${maxYear} for ${CAMPUS_ROLE_LABELS[values.campus_role]}`)
      return
    }

    const { error } = await signUp({
      email: values.email,
      password: values.password,
      full_name: values.full_name,
      campus_role: values.campus_role,
      department_id: values.department_id || undefined,
      roll_or_employee_id: values.roll_or_employee_id || undefined,
      year_of_study: needsYear ? year : undefined,
      designation: values.designation || undefined,
      experience_level: values.experience_level,
    })

    if (error) {
      setFormError(error)
      return
    }
    setSuccess(true)
    navigate('/onboarding')
  })

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-3xl font-semibold text-forest-900">Join CampusGigs</h1>
      <p className="mt-2 text-sm text-muted">Thapar campus only — @{domain} emails.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" {...register('full_name')} />
          <FieldError message={errors.full_name?.message} />
        </div>
        <div>
          <Label htmlFor="email">College email</Label>
          <Input id="email" type="email" placeholder={`you@${domain}`} {...register('email')} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register('password')} />
          <FieldError message={errors.password?.message} />
        </div>
        <div>
          <Label htmlFor="campus_role">Campus role</Label>
          <Select id="campus_role" {...register('campus_role')}>
            {SIGNUP_ROLES.map((r) => (
              <option key={r} value={r}>
                {CAMPUS_ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="department_id">Department</Label>
          <Select id="department_id" {...register('department_id')}>
            <option value="">Select…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} — {d.name}
              </option>
            ))}
          </Select>
          <FieldError message={errors.department_id?.message} />
        </div>

        {role !== 'faculty' && (
          <>
            <div>
              <Label htmlFor="roll_or_employee_id">Roll number</Label>
              <Input id="roll_or_employee_id" {...register('roll_or_employee_id')} />
            </div>
            <div>
              <Label htmlFor="year_of_study">{yearLabel}</Label>
              <Input
                id="year_of_study"
                type="number"
                min={1}
                max={role === 'ug_student' ? 4 : role === 'mtech' ? 2 : 3}
                {...register('year_of_study')}
              />
            </div>
          </>
        )}

        {role === 'faculty' && (
          <div>
            <Label htmlFor="designation">Designation</Label>
            <Input id="designation" placeholder="Assistant Professor" {...register('designation')} />
          </div>
        )}

        {(role === 'ug_student' || role === 'mtech' || role === 'phd') && (
          <p className="text-xs text-muted">
            Program is inferred from your department, so you only need to pick your department and current year.
          </p>
        )}

        <div>
          <Label htmlFor="experience_level">Experience level</Label>
          <Select id="experience_level" {...register('experience_level')}>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABELS[d]}
              </option>
            ))}
          </Select>
        </div>

        {formError && <p className="text-sm text-red-700">{formError}</p>}
        {success && (
          <p className="text-sm text-emerald-800">Account created. Check email if confirmation is required.</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-teal-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
