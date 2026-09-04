import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
  DIFFICULTY_LABELS,
  LISTING_TYPE_LABELS,
  TASK_STATUS_LABELS,
  type Difficulty,
  type ListingType,
  type TaskStatus,
} from '../lib/constants'
import type { Task } from '../types/database'
import { Badge } from './ui/Badge'

const statusTone: Record<TaskStatus, 'teal' | 'accent' | 'success' | 'warn' | 'danger' | 'muted'> = {
  open: 'teal',
  assigned: 'accent',
  submitted: 'warn',
  completed: 'success',
  disputed: 'danger',
  cancelled: 'muted',
}

export function TaskCard({ task }: { task: Task }) {
  return (
    <Link
      to={`/tasks/${task.id}`}
      className="group block border-b border-border/80 py-5 transition hover:bg-forest-50/40"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{LISTING_TYPE_LABELS[task.listing_type as ListingType]}</Badge>
        <Badge tone={statusTone[task.status as TaskStatus]}>
          {TASK_STATUS_LABELS[task.status as TaskStatus]}
        </Badge>
        <Badge tone="muted">{DIFFICULTY_LABELS[task.difficulty as Difficulty]}</Badge>
        {task.category && <Badge tone="muted">{task.category.name}</Badge>}
      </div>
      <h3 className="mt-2 font-display text-xl font-semibold text-forest-900 group-hover:text-teal-600">
        {task.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted">{task.description}</p>
      <p className="mt-3 text-xs text-muted">
        {task.poster?.full_name ?? 'Someone'} ·{' '}
        {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
      </p>
    </Link>
  )
}
