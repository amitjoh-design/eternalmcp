import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ToolCategory } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return formatDate(date)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .trim()
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return `${text.slice(0, length)}...`
}

export const CATEGORIES: Record<ToolCategory, { label: string; icon: string; color: string }> = {
  trading: { label: 'Trading', icon: '📈', color: 'text-emerald-400' },
  analytics: { label: 'Analytics', icon: '📊', color: 'text-blue-400' },
  automation: { label: 'Automation', icon: '⚡', color: 'text-yellow-400' },
  data: { label: 'Data', icon: '🗄️', color: 'text-cyan-400' },
  communication: { label: 'Communication', icon: '💬', color: 'text-purple-400' },
  security: { label: 'Security', icon: '🔐', color: 'text-red-400' },
  finance: { label: 'Finance', icon: '💰', color: 'text-green-400' },
  research: { label: 'Research', icon: '🔬', color: 'text-indigo-400' },
  productivity: { label: 'Productivity', icon: '🚀', color: 'text-orange-400' },
  other: { label: 'Other', icon: '🔧', color: 'text-gray-400' },
}

export function getCategoryMeta(category: ToolCategory) {
  return CATEGORIES[category] || CATEGORIES.other
}

export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const prefix = 'emcp_'
  const length = 32
  let key = prefix
  for (let i = 0; i < length; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

export function getAvatarUrl(name: string | null, email: string): string {
  const seed = name || email
  return `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(seed)}`
}

export function ratingToStars(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))
}

export const TOOL_SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest' },
  { value: 'usage_count', label: 'Most Used' },
  { value: 'avg_rating', label: 'Highest Rated' },
  { value: 'name', label: 'Name (A-Z)' },
] as const

export type SortOption = (typeof TOOL_SORT_OPTIONS)[number]['value']
