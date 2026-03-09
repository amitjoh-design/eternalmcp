'use client'

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, iconPosition = 'left', type = 'text', ...props }, ref) => {
    const base =
      'w-full bg-surface-2 border rounded-lg text-text-primary placeholder:text-muted transition-all duration-200 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm'

    const normalBorder = 'border-border-subtle focus:border-primary focus:ring-primary/50'
    const errorBorder = 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{icon}</div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              base,
              error ? errorBorder : normalBorder,
              icon && iconPosition === 'left' ? 'pl-10 pr-4 py-2.5' : 'px-4 py-2.5',
              icon && iconPosition === 'right' ? 'pr-10' : '',
              className
            )}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{icon}</div>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-text-secondary">{label}</label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full bg-surface-2 border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-muted transition-all duration-200 focus:outline-none focus:ring-1 disabled:opacity-50 resize-none',
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
              : 'border-border-subtle focus:border-primary focus:ring-primary/50',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
        <select
          ref={ref}
          className={cn(
            'w-full bg-surface-2 border rounded-lg px-4 py-2.5 text-sm text-text-primary transition-all duration-200 focus:outline-none focus:ring-1 disabled:opacity-50',
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
              : 'border-border-subtle focus:border-primary focus:ring-primary/50',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Input, Textarea, Select }
