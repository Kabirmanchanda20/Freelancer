import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState, Spinner, Textarea } from '../components/ui'
import { useAdminSetSuspended, useAdminStats, useAdminUsers } from '../features/admin/api'
import { useOpenDisputes, useResolveDispute } from '../features/disputes/api'
import { CAMPUS_ROLE_LABELS, type CampusRole } from '../lib/constants'

export function AdminPage() {
  const { data: users = [], isLoading: usersLoading } = useAdminUsers()
  const { data: stats } = useAdminStats()
  const { data: disputes = [], isLoading: disputesLoading } = useOpenDisputes()
  const setSuspended = useAdminSetSuspended()
  const resolve = useResolveDispute()
  const [resolutions, setResolutions] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-display text-3xl font-semibold text-forest-900">Admin</h1>
        <p className="mt-1 text-sm text-muted">Moderate users and resolve open disputes.</p>
      </div>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-white/70 p-4">
            <p className="text-xs uppercase text-muted">Users</p>
            <p className="font-display text-2xl font-semibold">{stats.users}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-white/70 p-4">
            <p className="text-xs uppercase text-muted">Open listings</p>
            <p className="font-display text-2xl font-semibold">{stats.open_tasks}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-white/70 p-4">
            <p className="text-xs uppercase text-muted">Open disputes</p>
            <p className="font-display text-2xl font-semibold">{stats.open_disputes}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-white/70 p-4">
            <p className="text-xs uppercase text-muted">Escrow held</p>
            <p className="font-display text-2xl font-semibold">{Number(stats.escrow_held)} cr</p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}

      <section>
        <h2 className="font-display text-xl font-semibold text-forest-900">Dispute queue</h2>
        {disputesLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : disputes.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No open disputes" />
          </div>
        ) : (
          <ul className="mt-4 space-y-6">
            {disputes.map((d) => (
              <li key={d.id} className="border-b border-border pb-5">
                <p className="font-medium text-ink">
                  {d.task ? (
                    <Link to={`/tasks/${d.task.id}`} className="text-teal-600 hover:underline">
                      {d.task.title}
                    </Link>
                  ) : (
                    'Task'
                  )}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Raised by {d.raiser?.full_name ?? 'user'}: {d.reason}
                </p>
                <Textarea
                  className="mt-3"
                  placeholder="Resolution note"
                  value={resolutions[d.id] ?? ''}
                  onChange={(e) => setResolutions((r) => ({ ...r, [d.id]: e.target.value }))}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={resolve.isPending}
                    onClick={() => {
                      setError(null)
                      void resolve
                        .mutateAsync({
                          disputeId: d.id,
                          resolution: resolutions[d.id] || 'Resolved — complete',
                          action: 'complete',
                        })
                        .catch((e: Error) => setError(e.message))
                    }}
                  >
                    Resolve → complete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resolve.isPending}
                    onClick={() => {
                      setError(null)
                      void resolve
                        .mutateAsync({
                          disputeId: d.id,
                          resolution: resolutions[d.id] || 'Resolved — cancel',
                          action: 'cancel',
                        })
                        .catch((e: Error) => setError(e.message))
                    }}
                  >
                    Resolve → cancel
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-forest-900">Users</h2>
        {usersLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="py-2 pr-3 font-medium">Name</th>
                  <th className="py-2 pr-3 font-medium">Role</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/60">
                    <td className="py-3 pr-3">
                      <Link to={`/profile/${u.id}`} className="font-medium hover:text-teal-600">
                        {u.full_name}
                      </Link>
                      <p className="text-xs text-muted">{u.college_email}</p>
                    </td>
                    <td className="py-3 pr-3">
                      {CAMPUS_ROLE_LABELS[u.campus_role as CampusRole]}
                      {u.is_admin && (
                        <Badge className="ml-2" tone="warn">
                          admin
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      {u.is_suspended ? (
                        <Badge tone="danger">Suspended</Badge>
                      ) : (
                        <Badge tone="success">Active</Badge>
                      )}
                    </td>
                    <td className="py-3">
                      <Button
                        size="sm"
                        variant={u.is_suspended ? 'secondary' : 'danger'}
                        disabled={setSuspended.isPending}
                        onClick={() => {
                          setError(null)
                          void setSuspended
                            .mutateAsync({ userId: u.id, suspended: !u.is_suspended })
                            .catch((e: Error) => setError(e.message))
                        }}
                      >
                        {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
