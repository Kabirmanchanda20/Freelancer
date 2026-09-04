import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

const tones = {
  default: 'bg-forest-100 text-forest-800',
  teal: 'bg-teal-500/15 text-teal-600',
  accent: 'bg-accent-100 text-accent-600',
  muted: 'bg-border/60 text-muted',
  success: 'bg-emerald-100 text-emerald-800',
  warn: 'bg-amber-100 text-amber-900',
  danger: 'bg-red-100 text-red-800',
} as const

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: keyof typeof tones
}

export function Badge({ className, tone = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
