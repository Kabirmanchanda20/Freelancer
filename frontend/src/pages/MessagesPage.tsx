import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { EmptyState, Spinner, Badge } from '../components/ui'
import { useInbox } from '../features/messaging/api'
import { TASK_STATUS_LABELS, type TaskStatus } from '../lib/constants'

export function MessagesPage() {
  const { data = [], isLoading } = useInbox()

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-forest-900">Messages</h1>
      <p className="mt-1 text-sm text-muted">Threads refresh every few seconds while this page is open.</p>

      {data.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No active threads"
            description="Messages appear once a listing is assigned and someone chats."
          />
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-border/70">
          {data.map((t) => (
            <li key={t.task_id}>
              <Link
                to={`/tasks/${t.task_id}`}
                className="block py-4 transition hover:bg-forest-50/50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="muted">{TASK_STATUS_LABELS[t.status as TaskStatus] ?? t.status}</Badge>
                  <span className="text-xs text-muted">
                    {formatDistanceToNow(new Date(t.last_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-2 font-display text-lg font-semibold text-forest-900">{t.title}</p>
                <p className="line-clamp-1 text-sm text-muted">{t.last_message}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
