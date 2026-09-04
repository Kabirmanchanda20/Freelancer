import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import { Button, EmptyState, Spinner } from '../components/ui'
import { useMarkNotificationsRead, useNotifications } from '../features/notifications/api'

export function NotificationsPage() {
  const { data = [], isLoading } = useNotifications()
  const markRead = useMarkNotificationsRead()

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-forest-900">Notifications</h1>
          <p className="mt-1 text-sm text-muted">Updates on applications, tasks, and disputes.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={markRead.isPending}
          onClick={() => void markRead.mutateAsync()}
        >
          Mark all read
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="You're all caught up" description="New activity will show up here." />
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-border/70">
          {data.map((n) => {
            const taskId =
              n.payload && typeof n.payload === 'object' && 'task_id' in n.payload
                ? String(n.payload.task_id)
                : null
            return (
              <li
                key={n.id}
                className={`py-4 ${n.is_read ? 'opacity-70' : 'bg-forest-50/40'}`}
              >
                <p className="text-sm font-medium text-ink">{formatType(n.type)}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
                {taskId && (
                  <Link to={`/tasks/${taskId}`} className="mt-2 inline-block text-sm text-teal-600 hover:underline">
                    View task
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function formatType(type: string) {
  return type.replace(/_/g, ' ')
}
