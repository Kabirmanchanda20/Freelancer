import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { PublicListingCard } from '../components/PublicListingCard'
import { EmptyState, Spinner } from '../components/ui'
import { buttonVariants } from '../components/ui/buttonVariants'
import { useMyTasks } from '../features/tasks/api'
import { useWallet } from '../features/wallet/api'
import { cn } from '../lib/cn'

type Tab = 'posted' | 'working'

export function MyListingsPage() {
  const { user, profile } = useAuth()
  const { data = [], isLoading } = useMyTasks(user?.id)
  const { data: wallet } = useWallet()
  const [tab, setTab] = useState<Tab>('posted')

  const posted = useMemo(() => data.filter((t) => t.poster_id === user?.id), [data, user?.id])
  const working = useMemo(() => data.filter((t) => t.worker_id === user?.id), [data, user?.id])

  const postedOpen = posted.filter((t) => t.status === 'open').length
  const awaitingReview = posted.filter((t) => t.status === 'submitted').length
  const workingActive = working.filter((t) => ['assigned', 'submitted'].includes(t.status)).length

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  const list = tab === 'posted' ? posted : working

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-forest-900">My dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Switch between poster and worker views. Credits: {wallet?.balance ?? profile?.wallet_balance ?? 0}
          </p>
        </div>
        <Link to="/listings/new" className={buttonVariants()}>
          Post new
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Open as poster</p>
          <p className="mt-1 font-display text-2xl font-semibold text-forest-900">{postedOpen}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Awaiting your review</p>
          <p className="mt-1 font-display text-2xl font-semibold text-forest-900">{awaitingReview}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Active as worker</p>
          <p className="mt-1 font-display text-2xl font-semibold text-forest-900">{workingActive}</p>
        </div>
      </div>

      <div className="mt-8 flex gap-2">
        <button
          type="button"
          onClick={() => setTab('posted')}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium ring-1 transition',
            tab === 'posted'
              ? 'bg-forest-800 text-white ring-forest-800'
              : 'bg-white/70 text-muted ring-border hover:text-ink',
          )}
        >
          Poster ({posted.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('working')}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium ring-1 transition',
            tab === 'working'
              ? 'bg-forest-800 text-white ring-forest-800'
              : 'bg-white/70 text-muted ring-border hover:text-ink',
          )}
        >
          Worker ({working.length})
        </button>
      </div>

      <section className="mt-6">
        {list.length === 0 ? (
          <EmptyState
            title={tab === 'posted' ? 'No posts yet' : 'No assignments'}
            description={
              tab === 'posted'
                ? 'Share a gig or workshop with campus.'
                : 'Apply to open listings from Browse.'
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((t) => (
              <PublicListingCard key={t.id} task={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
