'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { SearchFilter } from '@/components/marketplace/SearchFilter'
import { ToolCard, ToolCardSkeleton } from '@/components/marketplace/ToolCard'
import { MCPTool, ToolCategory } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

const PAGE_SIZE = 12

interface FilterState {
  search: string
  category: ToolCategory | 'all'
  sort: string
  tags: string[]
}

export default function MarketplacePage() {
  const [tools, setTools] = useState<MCPTool[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    sort: 'created_at',
    tags: [],
  })
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const supabase = createClient()

  const fetchTools = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('mcp_tools')
        .select(
          `
          *,
          creator:users!mcp_tools_creator_id_fkey(id, name, email, avatar_url),
          usage_count:tool_usage(usage_count),
          avg_rating:reviews(rating)
        `,
          { count: 'exact' }
        )
        .eq('status', 'approved')

      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        )
      }

      if (filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }

      if (filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }

      const sortMap: Record<string, { column: string; ascending: boolean }> = {
        created_at: { column: 'created_at', ascending: false },
        name: { column: 'name', ascending: true },
        usage_count: { column: 'created_at', ascending: false },
        avg_rating: { column: 'created_at', ascending: false },
      }

      const sort = sortMap[filters.sort] || sortMap.created_at
      query = query.order(sort.column, { ascending: sort.ascending })

      const from = (page - 1) * PAGE_SIZE
      query = query.range(from, from + PAGE_SIZE - 1)

      const { data, error, count } = await query

      if (error) throw error
      setTools((data as unknown as MCPTool[]) || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Failed to fetch tools:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, page, supabase])

  useEffect(() => {
    fetchTools()
  }, [fetchTools])

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setPage(1)
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border-subtle">
        <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-primary" />
                <span className="text-sm text-primary font-medium">MCP Marketplace</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-text-primary mb-3">
                Discover MCP Tools
              </h1>
              <p className="text-text-secondary max-w-lg">
                Browse the largest collection of Model Context Protocol tools. Connect your AI to real-world capabilities.
              </p>
            </div>
            <div className="bg-surface border border-border-subtle rounded-2xl px-6 py-4 text-center">
              <p className="text-3xl font-black text-text-primary">{totalCount}</p>
              <p className="text-sm text-muted">tools available</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <SearchFilter onFilterChange={handleFilterChange} resultCount={totalCount} />
        </div>

        {/* Tools grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <ToolCardSkeleton key={i} />
            ))}
          </div>
        ) : tools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tools.map((tool, i) => (
              <ToolCard key={tool.id} tool={tool} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-text-primary mb-2">No tools found</h3>
            <p className="text-text-secondary">
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <Button
              variant="secondary"
              size="sm"
              icon={<ChevronLeft size={16} />}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      page === pageNum
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={<ChevronRight size={16} />}
              iconPosition="right"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
