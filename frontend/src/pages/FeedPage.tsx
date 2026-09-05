import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Briefcase, Filter, GraduationCap, Search, X, Zap } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { PublicListingCard } from '../components/PublicListingCard'
import { CategorySelect } from '../components/CategorySelect'
import { Button, EmptyState, Select } from '../components/ui'
import { useCategories, useDepartments } from '../features/catalog/api'
import { useRecommendations } from '../features/recommendations/api'
import { useTasks, type TaskFilters } from '../features/tasks/api'
import { getErrorMessage } from '../lib/api/client'
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  LISTING_TYPE_LABELS,
  type ListingType,
} from '../lib/constants'
import { buttonVariants } from '../components/ui/buttonVariants'

/* ── quick-filter type chips ─────────────────────────── */
const TYPE_CHIPS: { value: ListingType | ''; label: string; icon: React.ElementType; color: string }[] = [
  { value: '', label: 'All', icon: Filter, color: 'bg-forest-100 text-forest-700 ring-forest-300/50' },
  { value: 'gig', label: 'Gigs', icon: Zap, color: 'bg-teal-500/10 text-teal-600 ring-teal-300/50' },
  { value: 'workshop', label: 'Workshops', icon: BookOpen, color: 'bg-accent-100 text-accent-600 ring-accent-300/50' },
  { value: 'project', label: 'Projects', icon: Briefcase, color: 'bg-forest-100 text-forest-700 ring-forest-300/50' },
  { value: 'mentorship', label: 'Mentorship', icon: GraduationCap, color: 'bg-violet-50 text-violet-700 ring-violet-200' },
]

export function FeedPage() {
  const { session } = useAuth()
  const [filters, setFilters] = useState<TaskFilters>({ q: '', listing_type: '', category_id: '', difficulty: '', sort: 'newest' })
  const [showFilters, setShowFilters] = useState(false)
  const { data, isLoading, isError, error, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useTasks(filters)
  const { data: recommended = [] } = useRecommendations(!!session)
  const { data: categories = [] } = useCategories()
  const { data: departments = [] } = useDepartments()

  const tasks = useMemo(() => data?.pages.flat() ?? [], [data])
  const activeFilterCount = [filters.category_id, filters.difficulty, filters.department_id].filter(Boolean).length

  const clearFilters = () =>
    setFilters({ q: '', listing_type: '', category_id: '', difficulty: '', department_id: '', sort: 'newest' })

  return (
    <div>
      {/* ── hero header ────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest-900 via-forest-800 to-forest-950 px-5 py-7 sm:px-8 sm:py-9">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-60 w-60 rounded-full bg-teal-500/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-accent-500/10 blur-2xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Browse campus listings
            </h1>
            <p className="mt-1.5 max-w-md text-sm text-white/60">
              {tasks.length > 0
                ? `${tasks.length}+ open gigs, workshops & projects from Thapar students and faculty.`
                : 'Find gigs, workshops, projects, and mentorship.'}
            </p>
          </div>
          {session && (
            <Link to="/listings/new" className={buttonVariants({ size: 'lg' })}>
              + Post a listing
            </Link>
          )}
        </div>

        {/* search bar */}
        <div className="relative mt-5 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/20 backdrop-blur-md sm:max-w-lg">
          <Search className="h-4 w-4 shrink-0 text-white/50" />
          <input
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
            placeholder="Search listings — React, ML, LaTeX, events…"
            value={filters.q ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
          {filters.q && (
            <button onClick={() => setFilters((f) => ({ ...f, q: '' }))} className="text-white/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── type chips ─────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {TYPE_CHIPS.map(({ value, label, icon: Icon, color }) => {
          const active = filters.listing_type === value
          return (
            <button
              key={value}
              onClick={() => setFilters((f) => ({ ...f, listing_type: value }))}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-all ${
                active
                  ? `${color} shadow-sm scale-[1.02]`
                  : 'bg-white/60 text-muted ring-border/60 hover:bg-forest-50 hover:text-ink'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          )
        })}

        <Select
          className="ml-auto w-auto min-w-[9rem]"
          value={filters.sort ?? 'newest'}
          onChange={(e) =>
            setFilters((f) => ({ ...f, sort: e.target.value as TaskFilters['sort'] }))
          }
        >
          <option value="newest">Newest</option>
          <option value="deadline">Deadline soon</option>
          <option value="budget_high">Highest credits</option>
          <option value="rating">Top rated posters</option>
        </Select>

        {/* advanced filter toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition ${
            showFilters || activeFilterCount > 0
              ? 'bg-teal-500/10 text-teal-600 ring-teal-300/50'
              : 'bg-white/60 text-muted ring-border/60 hover:bg-forest-50'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── advanced filters ──────────────────────────── */}
      {showFilters && (
        <div className="mt-3 animate-fade-up rounded-xl border border-border/60 bg-white/70 p-4 backdrop-blur-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Category</label>
              <CategorySelect
                categories={categories}
                value={filters.category_id ?? ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFilters((f) => ({ ...f, category_id: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Difficulty</label>
              <Select
                value={filters.difficulty ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, difficulty: e.target.value as TaskFilters['difficulty'] }))
                }
              >
                <option value="">Any</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Department</label>
              <Select
                value={filters.department_id ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, department_id: e.target.value }))}
              >
                <option value="">Any</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
                ))}
              </Select>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="mt-3 text-xs font-medium text-teal-600 hover:underline">
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* ── recommended (logged-in only) ─────────────── */}
      {session && recommended.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold text-forest-900">Recommended for you</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.slice(0, 3).map((t) => (
              <PublicListingCard key={t.id} task={t} />
            ))}
          </div>
        </section>
      )}

      {/* ── main listings grid ────────────────────────── */}
      <section className="mt-8">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <p className="text-base text-ink">
            {isLoading ? (
              'Loading listings…'
            ) : (
              <>
                Found <span className="font-semibold">{tasks.length}</span>{' '}
                {filters.listing_type
                  ? LISTING_TYPE_LABELS[filters.listing_type as ListingType].toLowerCase() +
                    (tasks.length === 1 ? '' : 's')
                  : tasks.length === 1
                    ? 'listing'
                    : 'listings'}
              </>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
                <div className="flex justify-between">
                  <div className="h-5 w-2/3 rounded bg-border/60" />
                  <div className="h-5 w-16 rounded-full bg-border/60" />
                </div>
                <div className="mt-3 h-4 w-20 rounded bg-border/60" />
                <div className="mt-5 space-y-2">
                  <div className="h-3.5 w-1/2 rounded bg-border/60" />
                  <div className="h-3.5 w-2/3 rounded bg-border/60" />
                  <div className="h-3.5 w-3/5 rounded bg-border/60" />
                </div>
                <div className="mt-5 h-10 w-full rounded-lg bg-border/60" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="mt-4">
            <EmptyState title="Couldn’t load listings" description={getErrorMessage(error)} />
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => void refetch()}
                className="text-sm font-medium text-teal-600 hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No listings match"
              description={
                activeFilterCount > 0
                  ? 'Try removing some filters to see more results.'
                  : 'No open listings yet. Be the first to post one!'
              }
            />
            {activeFilterCount > 0 && (
              <div className="mt-3 text-center">
                <button onClick={clearFilters} className="text-sm font-medium text-teal-600 hover:underline">
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((t) => (
              <PublicListingCard key={t.id} task={t} />
            ))}
          </div>
        )}

        {hasNextPage && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Loading…' : 'Load more listings'}
            </Button>
          </div>
        )}
      </section>

      {/* ── guest CTA ─────────────────────────────────── */}
      {!session && (
        <section className="mt-12 rounded-2xl border border-teal-200/60 bg-gradient-to-r from-teal-500/5 to-forest-50 p-8 text-center">
          <h3 className="font-display text-2xl font-bold text-forest-900">
            Want to apply or post your own listing?
          </h3>
          <p className="mt-2 text-sm text-muted">
            Sign up with your @thapar.edu email — it takes 30 seconds and it's completely free.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/signup" className={buttonVariants()}>
              Create free account
            </Link>
            <Link to="/login" className={buttonVariants({ variant: 'outline' })}>
              Already have an account?
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
