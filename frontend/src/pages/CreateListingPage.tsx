import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { CategorySelect } from '../components/CategorySelect'
import { Button, FieldError, Input, Label, Select, Textarea } from '../components/ui'
import { useCategories, useDepartments } from '../features/catalog/api'
import { useCreateTask } from '../features/tasks/api'
import {
  CAMPUS_ROLES,
  CAMPUS_ROLE_LABELS,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  LISTING_TYPES,
  LISTING_TYPE_LABELS,
  MODES,
  MODE_LABELS,
  type ListingType,
} from '../lib/constants'

const schema = z.object({
  title: z.string().min(5, 'Title too short'),
  description: z.string().min(20, 'Add a bit more detail'),
  category_id: z.string().min(1, 'Pick a category'),
  difficulty: z.enum(DIFFICULTIES),
  listing_type: z.enum(LISTING_TYPES),
  budget: z.string().optional(),
  deadline: z.string().optional(),
  venue: z.string().optional(),
  mode: z.string().optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  max_participants: z.string().optional(),
  target_department_id: z.string().optional(),
})

export function CreateListingPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { data: categories = [] } = useCategories()
  const { data: departments = [] } = useDepartments()
  const createTask = useCreateTask()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      listing_type: 'gig' as const,
      difficulty: 'beginner' as const,
      mode: '',
      max_participants: '',
      title: '',
      description: '',
      category_id: '',
      budget: '0',
    },
  })

  const listingType = (useWatch({ control, name: 'listing_type' }) ?? 'gig') as ListingType
  const canHostWorkshop = !!profile?.can_host_workshops

  const onSubmit = handleSubmit(async (values) => {
    if (!user) return
    setError(null)

    if (values.listing_type === 'workshop' && !canHostWorkshop) {
      setError('Your role cannot host workshops. Faculty, PhD, and department accounts can.')
      return
    }

    if (values.listing_type === 'workshop') {
      if (!values.starts_at) {
        setError('Workshop start is required')
        return
      }
      if (!values.mode) {
        setError('Mode is required for workshops')
        return
      }
    }

    const maxParticipants = values.max_participants?.trim()
      ? Number(values.max_participants)
      : null
    if (maxParticipants !== null && (Number.isNaN(maxParticipants) || maxParticipants < 1)) {
      setError('Max participants must be a positive number')
      return
    }

    const budgetRaw = values.budget?.trim()
    const budget = budgetRaw ? Number(budgetRaw) : 0
    if (Number.isNaN(budget) || budget < 0) {
      setError('Budget must be 0 or more credits')
      return
    }

    try {
      const task = await createTask.mutateAsync({
        poster_id: user.id,
        title: values.title,
        description: values.description,
        category_id: values.category_id,
        difficulty: values.difficulty,
        listing_type: values.listing_type,
        budget,
        deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
        venue: values.venue || null,
        mode: (values.mode as (typeof MODES)[number]) || null,
        starts_at: values.starts_at ? new Date(values.starts_at).toISOString() : null,
        ends_at: values.ends_at ? new Date(values.ends_at).toISOString() : null,
        max_participants: maxParticipants,
        target_department_id: values.target_department_id || null,
      })
      navigate(`/tasks/${task.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create listing')
    }
  })

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-forest-900">Post a listing</h1>
      <p className="mt-2 text-sm text-muted">
        Share a gig, workshop, project, or mentorship opportunity. Payment is deferred — focus on the work.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="listing_type">Type</Label>
          <Select id="listing_type" {...register('listing_type')}>
            {LISTING_TYPES.map((t) => (
              <option key={t} value={t} disabled={t === 'workshop' && !canHostWorkshop}>
                {LISTING_TYPE_LABELS[t]}
                {t === 'workshop' && !canHostWorkshop ? ' (hosts only)' : ''}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register('title')} />
          <FieldError message={errors.title?.message} />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={6} {...register('description')} />
          <FieldError message={errors.description?.message} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="category_id">Category</Label>
            <CategorySelect
              id="category_id"
              categories={categories}
              placeholder="Select…"
              {...register('category_id')}
            />
            <FieldError message={errors.category_id?.message} />
          </div>
          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select id="difficulty" {...register('difficulty')}>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABELS[d]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {listingType !== 'workshop' && (
          <div>
            <Label htmlFor="budget">Credits offered (optional escrow)</Label>
            <Input id="budget" type="number" min={0} step={1} {...register('budget')} />
            <p className="mt-1 text-xs text-muted">
              Held from your wallet when you accept an applicant. Free listings use 0.
              Balance: {profile?.wallet_balance ?? 0}
            </p>
          </div>
        )}

        {listingType !== 'workshop' && (
          <div>
            <Label htmlFor="deadline">Deadline</Label>
            <Input id="deadline" type="datetime-local" {...register('deadline')} />
          </div>
        )}

        {(listingType === 'workshop' || listingType === 'mentorship') && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="starts_at">Starts at</Label>
                <Input id="starts_at" type="datetime-local" {...register('starts_at')} />
                <FieldError message={errors.starts_at?.message} />
              </div>
              <div>
                <Label htmlFor="ends_at">Ends at</Label>
                <Input id="ends_at" type="datetime-local" {...register('ends_at')} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="mode">Mode</Label>
                <Select id="mode" {...register('mode')}>
                  <option value="">Select…</option>
                  {MODES.map((m) => (
                    <option key={m} value={m}>
                      {MODE_LABELS[m]}
                    </option>
                  ))}
                </Select>
                <FieldError message={errors.mode?.message} />
              </div>
              <div>
                <Label htmlFor="venue">Venue / link</Label>
                <Input id="venue" {...register('venue')} />
              </div>
            </div>
            {listingType === 'workshop' && (
              <div>
                <Label htmlFor="max_participants">Max participants</Label>
                <Input id="max_participants" type="number" min={1} {...register('max_participants')} />
              </div>
            )}
          </>
        )}

        <div>
          <Label htmlFor="target_department_id">Target department (optional)</Label>
          <Select id="target_department_id" {...register('target_department_id')}>
            <option value="">Open to all</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} — {d.name}
              </option>
            ))}
          </Select>
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <Button type="submit" disabled={isSubmitting || createTask.isPending}>
          {isSubmitting ? 'Publishing…' : 'Publish listing'}
        </Button>
      </form>

      {!canHostWorkshop && (
        <p className="mt-4 text-xs text-muted">
          Workshop hosting is limited to {CAMPUS_ROLES.filter((r) => ['faculty', 'phd', 'department'].includes(r))
            .map((r) => CAMPUS_ROLE_LABELS[r])
            .join(', ')}.
        </p>
      )}
    </div>
  )
}
