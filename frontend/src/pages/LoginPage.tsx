import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { env } from '../lib/env'
import { Button, FieldError, Input, Label } from '../components/ui'

const schema = z.object({
  email: z.email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export function LoginPage() {
  const { signIn, session, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)
  const domain = env?.allowedEmailDomain ?? 'thapar.edu'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  if (!loading && session) {
    const from = (location.state as { from?: string } | null)?.from ?? '/feed'
    return <Navigate to={from} replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    if (!values.email.toLowerCase().endsWith(`@${domain}`)) {
      setFormError(`Email must end with @${domain}`)
      return
    }
    const { error } = await signIn(values.email, values.password)
    if (error) {
      setFormError(error)
      return
    }
    navigate('/feed')
  })

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl font-semibold text-forest-900">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">Sign in with your @{domain} email.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder={`you@${domain}`} {...register('email')} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register('password')} />
          <FieldError message={errors.password?.message} />
        </div>
        {formError && <p className="text-sm text-red-700">{formError}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New here?{' '}
        <Link to="/signup" className="font-medium text-teal-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
