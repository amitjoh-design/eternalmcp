'use client'

import { useState, useCallback } from 'react'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CATEGORIES, TOOL_SORT_OPTIONS, type SortOption } from '@/lib/utils'
import { ToolCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

interface FilterState {
  search: string
  category: ToolCategory | 'all'
  sort: SortOption
  tags: string[]
}

interface SearchFilterProps {
  onFilterChange: (filters: FilterState) => void
  resultCount: number
}

const POPULAR_TAGS = [
  'Trading', 'Automation', 'Analytics', 'AI', 'Python', 'REST API',
  'Real-time', 'Finance', 'Security', 'Data', 'Machine Learning',
]

export function SearchFilter({ onFilterChange, resultCount }: SearchFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    sort: 'created_at',
    tags: [],
  })
  const [showFilters, setShowFilters] = useState(false)

  const updateFilter = useCallback(
    (update: Partial<FilterState>) => {
      const newFilters = { ...filters, ...update }
      setFilters(newFilters)
      onFilterChange(newFilters)
    },
    [filters, onFilterChange]
  )

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag]
    updateFilter({ tags: newTags })
  }

  const clearAll = () => {
    const reset: FilterState = { search: '', category: 'all', sort: 'created_at', tags: [] }
    setFilters(reset)
    onFilterChange(reset)
  }

  const hasActiveFilters =
    filters.search || filters.category !== 'all' || filters.tags.length > 0

  return (
    <div className="space-y-4">
      {/* Search bar + controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search MCP tools..."
            value={filters.search}
            onChange={(e) => updateFilter({ search: e.target.value })}
            icon={<Search size={16} />}
            className="h-11"
          />
        </div>

        <div className="flex gap-2">
          {/* Sort */}
          <div className="relative">
            <select
              value={filters.sort}
              onChange={(e) => updateFilter({ sort: e.target.value as SortOption })}
              className="h-11 pl-3 pr-8 bg-surface-2 border border-border-subtle rounded-lg text-sm text-text-secondary focus:outline-none focus:border-primary appearance-none cursor-pointer"
            >
              {TOOL_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-surface">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            size="md"
            icon={<SlidersHorizontal size={16} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
            {hasActiveFilters && (
              <span className="ml-1 w-5 h-5 bg-white/20 rounded-full text-xs flex items-center justify-center">
                {(filters.category !== 'all' ? 1 : 0) + filters.tags.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="bg-surface border border-border-subtle rounded-xl p-5 space-y-5">
          {/* Categories */}
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Category</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilter({ category: 'all' })}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm transition-all',
                  filters.category === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-surface-2 text-text-secondary hover:text-text-primary border border-border-subtle'
                )}
              >
                All
              </button>
              {Object.entries(CATEGORIES).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => updateFilter({ category: key as ToolCategory })}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all',
                    filters.category === key
                      ? 'bg-primary text-white'
                      : 'bg-surface-2 text-text-secondary hover:text-text-primary border border-border-subtle'
                  )}
                >
                  <span>{meta.icon}</span>
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Popular Tags</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs transition-all border',
                    filters.tags.includes(tag)
                      ? 'bg-primary/20 border-primary/40 text-primary-light'
                      : 'bg-surface-2 border-border-subtle text-text-secondary hover:border-primary/30 hover:text-text-primary'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Clear */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
              <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={clearAll}>
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Active filters & result count */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.category !== 'all' && (
            <Badge
              variant="primary"
              size="sm"
              className="cursor-pointer"
              onClick={() => updateFilter({ category: 'all' })}
            >
              {CATEGORIES[filters.category as ToolCategory]?.label}
              <X size={10} />
            </Badge>
          )}
          {filters.tags.map((tag) => (
            <Badge
              key={tag}
              variant="default"
              size="sm"
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              {tag}
              <X size={10} />
            </Badge>
          ))}
        </div>
        <p className="text-sm text-muted flex-shrink-0">
          <span className="text-text-primary font-semibold">{resultCount}</span> tools found
        </p>
      </div>
    </div>
  )
}
