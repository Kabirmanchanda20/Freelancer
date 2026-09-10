import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Calendar, MapPin, User } from 'lucide-react'
import {
  CAMPUS_ROLE_LABELS,
  LISTING_TYPE_LABELS,
  TASK_STATUS_LABELS,
  type CampusRole,
  type ListingType,
  type TaskStatus,
} from '../lib/constants'
import type { Task } from '../types/database'
import { cn } from '../lib/cn'

function locationLabel(task: Task): string {
  if (task.venue) return task.venue
  if (task.mode === 'online') return 'Online'
  if (task.mode === 'hybrid') return 'Hybrid'
  if (task.department?.code) return task.department.code
  return 'Campus'
}

export function PublicListingCard({
  task,
  className,
}: {
  task: Task
  className?: string
}) {
  const budget = Number(task.budget ?? 0)
  const posterName = task.poster?.full_name?.trim() || 'Thapar member'
  const role = task.poster?.campus_role
    ? CAMPUS_ROLE_LABELS[task.poster.campus_role as CampusRole]
    : null
  const statusLabel =
    task.status === 'open'
      ? 'Open'
      : TASK_STATUS_LABELS[task.status as TaskStatus] ?? task.status

  return (
    <Link
      to={`/tasks/${task.id}`}
      className={cn(
        'group flex h-full flex-col rounded-2xl border border-border/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300/50 hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 font-sans text-lg font-bold leading-snug text-ink transition-colors group-hover:text-teal-700 line-clamp-2">
          {task.title}
        </h3>
        <span className="shrink-0 rounded-full bg-forest-50 px-2.5 py-1 text-xs font-medium text-forest-800 ring-1 ring-border/70">
          {statusLabel}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {LISTING_TYPE_LABELS[task.listing_type as ListingType]}
        </span>
        {task.category?.name && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {task.category.name}
          </span>
        )}
        {budget > 0 && (
          <span className="rounded-md bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-600">
            {budget} credits
          </span>
        )}
      </div>

      <div className="mt-auto space-y-2 pt-4 text-sm text-muted">
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{locationLabel(task)}</span>
        </p>
        <p className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
          <span>Posted: {format(new Date(task.created_at), 'MMM d, yyyy')}</span>
        </p>
        <p className="flex items-center gap-2">
          <User className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">
            Posted by <span className="font-medium text-ink">{posterName}</span>
            {role ? ` · ${role}` : ''}
          </span>
        </p>
      </div>
    </Link>
  )
}
