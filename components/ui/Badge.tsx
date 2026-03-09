import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  size?: 'sm' | 'md'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const base = 'inline-flex items-center gap-1 font-medium rounded-full transition-colors'

    const variants = {
      default: 'bg-white/10 text-text-secondary border border-white/10',
      primary: 'bg-primary/20 text-primary-light border border-primary/30',
      success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
      info: 'bg-cyan-500/20 text-accent border border-cyan-500/30',
      outline: 'border border-border-subtle text-text-secondary',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-xs',
    }

    return (
      <span ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
