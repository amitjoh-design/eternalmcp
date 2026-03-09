'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, Zap, ExternalLink, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MCPTool } from '@/lib/types'
import { getCategoryMeta, formatNumber } from '@/lib/utils'
import { getAvatarUrl } from '@/lib/utils'
import Image from 'next/image'

interface ToolCardProps {
  tool: MCPTool
  index?: number
}

export function ToolCard({ tool, index = 0 }: ToolCardProps) {
  const categoryMeta = getCategoryMeta(tool.category)
  const rating = tool.avg_rating || 0
  const usageCount = tool.usage_count || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative flex flex-col bg-surface border border-border-subtle rounded-xl transition-all duration-300 hover:border-primary/30 hover:shadow-glow hover:translate-y-[-2px] overflow-hidden"
    >
      {/* Top accent line */}
      <div className="h-0.5 bg-gradient-to-r from-primary via-violet-glow to-accent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Tool icon/avatar */}
            <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 flex items-center justify-center">
              {tool.icon_url ? (
                <Image src={tool.icon_url} alt={tool.name} width={44} height={44} className="object-cover" />
              ) : (
                <span className="text-xl">{categoryMeta.icon}</span>
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                {tool.name}
              </h3>
              <p className="text-xs text-muted">v{tool.version}</p>
            </div>
          </div>

          {tool.is_featured && (
            <Badge variant="primary" size="sm" className="flex-shrink-0">
              Featured
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 mb-4 flex-1">
          {tool.description}
        </p>

        {/* Category & Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge variant="default" size="sm">
            {categoryMeta.icon} {categoryMeta.label}
          </Badge>
          {tool.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" size="sm">
              {tag}
            </Badge>
          ))}
          {tool.tags.length > 2 && (
            <Badge variant="outline" size="sm">
              +{tool.tags.length - 2}
            </Badge>
          )}
        </div>

        {/* Creator */}
        {tool.creator && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full overflow-hidden bg-primary/20">
              <Image
                src={tool.creator.avatar_url || getAvatarUrl(tool.creator.name, tool.creator.email)}
                alt={tool.creator.name || 'Creator'}
                width={20}
                height={20}
              />
            </div>
            <span className="text-xs text-muted">
              by <span className="text-text-secondary">{tool.creator.name || tool.creator.email?.split('@')[0]}</span>
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs border-t border-border-subtle pt-4">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-text-secondary font-medium">{rating.toFixed(1)}</span>
            <span className="text-muted">({tool.review_count || 0})</span>
          </div>
          <div className="flex items-center gap-1 text-muted">
            <Zap size={12} className="text-accent" />
            <span>{formatNumber(usageCount)} calls</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 flex gap-2">
        <Link href={`/tools/${tool.id}`} className="flex-1">
          <Button variant="primary" size="sm" className="w-full" icon={<ArrowRight size={14} />} iconPosition="right">
            View Tool
          </Button>
        </Link>
        {tool.documentation_url && (
          <a
            href={tool.documentation_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="sm" icon={<ExternalLink size={14} />}>
              Docs
            </Button>
          </a>
        )}
      </div>
    </motion.div>
  )
}

// Skeleton loader
export function ToolCardSkeleton() {
  return (
    <div className="animate-pulse bg-surface border border-border-subtle rounded-xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 bg-border-subtle rounded-xl" />
        <div>
          <div className="h-4 bg-border-subtle rounded w-32 mb-1.5" />
          <div className="h-3 bg-border-subtle rounded w-16" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-border-subtle rounded w-full" />
        <div className="h-3 bg-border-subtle rounded w-4/5" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-border-subtle rounded-full w-16" />
        <div className="h-5 bg-border-subtle rounded-full w-14" />
      </div>
      <div className="h-8 bg-border-subtle rounded-lg" />
    </div>
  )
}
