import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Clock, MapPin, Star, Users, BadgeCheck } from 'lucide-react'
import { LISTING_TYPE_LABELS, DIFFICULTY_LABELS, type ListingType, type Difficulty } from '../lib/constants'
import type { Task } from '../types/database'

const typeColor: Record<string, string> = {
  gig: 'bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20',
  workshop: 'bg-accent-100 text-accent-600 ring-1 ring-accent-500/20',
  project: 'bg-forest-100 text-forest-700 ring-1 ring-forest-300/40',
  mentorship: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
}

const diffColor: Record<string, string> = {
  beginner: 'text-emerald-600 bg-emerald-50',
  intermediate: 'text-amber-600 bg-amber-50',
  advanced: 'text-red-600 bg-red-50',
}

export function PublicListingCard({ task }: { task: Task }) {
  const isWorkshop = task.listing_type === 'workshop'
  const ago = formatDistanceToNow(new Date(task.created_at), { addSuffix: true })
  const rating = Number(task.poster?.avg_rating ?? 0)
  const completed = Number((task.poster as { completed_count?: number } | null | undefined)?.completed_count ?? 0)
  const budget = Number(task.budget ?? 0)

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-teal-300/60"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeColor[task.listing_type] ?? typeColor.gig}`}>
          {LISTING_TYPE_LABELS[task.listing_type as ListingType]}
        </span>
        {task.difficulty && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${diffColor[task.difficulty]}`}>
            {DIFFICULTY_LABELS[task.difficulty as Difficulty]}
          </span>
        )}
        {task.category && (
          <span className="rounded-full bg-forest-50 px-2.5 py-0.5 text-xs text-muted ring-1 ring-border/60">
            {task.category.name}
          </span>
        )}
        {budget > 0 && (
          <span className="rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-semibold text-accent-600">
            {budget} credits
          </span>
        )}
      </div>

      <h3 className="font-display text-lg font-semibold leading-snug text-forest-900 group-hover:text-teal-600 transition-colors">
        {task.title}
      </h3>

      <p className="line-clamp-2 text-sm text-muted leading-relaxed">{task.description}</p>

      {/* Trust signals */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1 font-medium text-forest-800">
          <BadgeCheck className="h-3.5 w-3.5 text-teal-500" />
          @thapar.edu
        </span>
        {rating > 0 && (
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
          </span>
        )}
        {completed > 0 && (
          <span>{completed} completed</span>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-muted pt-1 border-t border-border/50">
        {isWorkshop && task.max_participants && (
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {task.max_participants} seats
          </span>
        )}
        {isWorkshop && task.mode && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {task.mode === 'online' ? 'Online' : task.venue ?? task.mode}
          </span>
        )}
        {task.deadline && !isWorkshop && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Due {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
          </span>
        )}
        <span className="ml-auto font-medium">{task.poster?.full_name ?? 'Thapar member'} · {ago}</span>
      </div>
    </Link>
  )
}
