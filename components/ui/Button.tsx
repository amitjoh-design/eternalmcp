'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'glow'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed rounded-lg'

    const variants = {
      primary:
        'bg-primary hover:bg-primary-dark text-white focus:ring-primary shadow-glow hover:shadow-glow-lg',
      secondary:
        'bg-surface-2 hover:bg-border text-text-primary border border-border-subtle focus:ring-primary',
      ghost: 'hover:bg-white/5 text-text-secondary hover:text-text-primary focus:ring-primary',
      outline:
        'border border-primary/50 hover:border-primary text-primary hover:bg-primary/10 focus:ring-primary',
      danger:
        'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]',
      glow: 'relative overflow-hidden bg-gradient-to-r from-primary via-violet-glow to-accent text-white hover:opacity-90 focus:ring-primary shadow-glow-lg',
    }

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
      xl: 'h-14 px-8 text-lg',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          icon && iconPosition === 'left' && icon
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
