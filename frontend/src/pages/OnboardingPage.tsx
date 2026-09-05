import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useCategories } from '../features/catalog/api'
import { useSetUserInterests, useUpdateProfile } from '../features/profiles/api'
import { DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty } from '../lib/constants'
import { Button, Spinner } from '../components/ui'
import { cn } from '../lib/cn'

export function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { data: categories = [], isLoading } = useCategories()
  const updateProfile = useUpdateProfile()
  const setInterests = useSetUserInterests()
  const navigate = useNavigate()

  const [selected, setSelected] = useState<string[]>([])
  const [level, setLevel] = useState<Difficulty>(
    (profile?.experience_level as Difficulty) ?? 'beginner',
  )
  const [error, setError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 6 ? prev : [...prev, id],
    )
  }

  const finish = async () => {
    if (!user) return
    setError(null)
    if (selected.length < 1) {
      setError('Pick at least one interest')
      return
    }
    try {
      await setInterests.mutateAsync({ userId: user.id, categoryIds: selected })
      await updateProfile.mutateAsync({
        id: user.id,
        patch: { experience_level: level, onboarding_completed: true },
      })
      await refreshProfile()
      navigate('/feed')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save onboarding')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-forest-900">Set up your feed</h1>
      <p className="mt-2 text-sm text-muted">
        Tell us what you care about so we can recommend better listings.
      </p>

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-xs text-muted">
          <span>Profile setup</span>
          <span>{Math.min(100, Math.round((selected.length / 3) * 70 + (level ? 30 : 0)))}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-border/60">
          <div
            className="h-full rounded-full bg-teal-500 transition-all"
            style={{
              width: `${Math.min(100, Math.round((selected.length / 3) * 70 + (level ? 30 : 0)))}%`,
            }}
          />
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-forest-700">
          Experience
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setLevel(d)}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm transition',
                level === d
                  ? 'border-forest-700 bg-forest-800 text-white'
                  : 'border-border bg-white/70 text-ink hover:border-forest-400',
              )}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-forest-700">
          Interests (up to 6)
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => {
            const on = selected.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm transition',
                  on
                    ? 'border-teal-500 bg-teal-500/15 text-teal-600'
                    : 'border-border bg-white/70 text-ink hover:border-teal-400',
                )}
              >
                {c.name}
              </button>
            )
          })}
        </div>
      </section>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <Button
        className="mt-8"
        onClick={() => void finish()}
        disabled={updateProfile.isPending || setInterests.isPending}
      >
        Continue to feed
      </Button>
    </div>
  )
}
