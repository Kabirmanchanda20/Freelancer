import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import {
  buttonSizeClasses,
  buttonVariantClasses,
  type ButtonSize,
  type ButtonVariant,
} from './buttonVariants'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed',
        buttonVariantClasses[variant],
        buttonSizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
