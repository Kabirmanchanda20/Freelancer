import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format } from 'date-fns'
import { useAuth } from '../auth/useAuth'
import { Spinner, EmptyState } from '../components/ui'
import { useMyTasks } from '../features/tasks/api'
import { LISTING_TYPE_LABELS, type ListingType } from '../lib/constants'

export function AnalyticsPage() {
  const { user } = useAuth()
  const { data: tasks = [], isLoading } = useMyTasks(user?.id)

  const completedAsWorker = useMemo(
    () => tasks.filter((t) => t.worker_id === user?.id && t.status === 'completed'),
    [tasks, user?.id],
  )

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of completedAsWorker) {
      const name = t.category?.name ?? 'Other'
      map.set(name, (map.get(name) ?? 0) + 1)
    }
    return [...map.entries()].map(([name, count]) => ({ name, count }))
  }, [completedAsWorker])

  const byMonth = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of completedAsWorker) {
      const key = format(new Date(t.updated_at), 'yyyy-MM')
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }))
  }, [completedAsWorker])

  const byType = useMemo(() => {
    const map = new Map<ListingType, number>()
    for (const t of tasks.filter((x) => x.poster_id === user?.id)) {
      map.set(t.listing_type, (map.get(t.listing_type) ?? 0) + 1)
    }
    return [...map.entries()].map(([type, count]) => ({
      name: LISTING_TYPE_LABELS[type],
      count,
    }))
  }, [tasks, user?.id])

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        description="Complete or post listings to see your analytics."
      />
    )
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold text-forest-900">Your analytics</h1>
        <p className="mt-1 text-sm text-muted">
          Completions and posting activity (credits/payments deferred).
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white/70 p-4">
          <h2 className="text-sm font-semibold text-forest-800">Completions by category</h2>
          <div className="mt-4 h-64">
            {byCategory.length === 0 ? (
              <p className="text-sm text-muted">No completed work yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d5e3dc" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2f7260" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white/70 p-4">
          <h2 className="text-sm font-semibold text-forest-800">Completions over time</h2>
          <div className="mt-4 h-64">
            {byMonth.length === 0 ? (
              <p className="text-sm text-muted">No completed work yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d5e3dc" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#14919b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white/70 p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-forest-800">Listings you posted by type</h2>
          <div className="mt-4 h-64">
            {byType.length === 0 ? (
              <p className="text-sm text-muted">You have not posted yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d5e3dc" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#d9783a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
