import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

const variants = {
  primary:
    'bg-forest-800 text-white hover:bg-forest-700 focus-visible:ring-forest-500 disabled:bg-forest-300',
  secondary:
    'bg-teal-500 text-white hover:bg-teal-600 focus-visible:ring-teal-400 disabled:opacity-50',
  accent:
    'bg-accent-500 text-white hover:bg-accent-600 focus-visible:ring-accent-400 disabled:opacity-50',
  outline:
    'border border-border bg-white/70 text-ink hover:bg-forest-50 focus-visible:ring-forest-400',
  ghost: 'text-muted hover:bg-forest-50 hover:text-ink focus-visible:ring-forest-300',
  danger: 'bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-500',
} as const

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
} as const

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'

export const buttonVariants = (opts?: {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  className?: string
}) =>
  cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    variants[opts?.variant ?? 'primary'],
    sizes[opts?.size ?? 'md'],
    opts?.className,
  )
