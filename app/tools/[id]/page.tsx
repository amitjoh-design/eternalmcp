import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getCategoryMeta, formatNumber, formatDate, getAvatarUrl } from '@/lib/utils'
import { MCPTool } from '@/lib/types'
import {
  Star, Zap, ExternalLink, Github, Copy, ArrowLeft,
  Calendar, Tag, Globe, Shield
} from 'lucide-react'
import Image from 'next/image'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: tool } = await supabase
    .from('mcp_tools')
    .select('name, description')
    .eq('id', id)
    .single()

  return {
    title: tool?.name || 'Tool',
    description: tool?.description || '',
  }
}

async function getReviews(supabase: Awaited<ReturnType<typeof createClient>>, toolId: string) {
  const { data } = await supabase
    .from('reviews')
    .select('*, user:users!reviews_user_id_fkey(id, name, email, avatar_url)')
    .eq('tool_id', toolId)
    .order('created_at', { ascending: false })
    .limit(10)
  return data || []
}

export default async function ToolDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: tool, error } = await supabase
    .from('mcp_tools')
    .select(
      `
      *,
      creator:users!mcp_tools_creator_id_fkey(id, name, email, avatar_url, github_username, bio)
    `
    )
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (error || !tool) notFound()

  const mcpTool = tool as unknown as MCPTool
  const reviews = await getReviews(supabase, id)
  const categoryMeta = getCategoryMeta(mcpTool.category)

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-8">
          <ArrowLeft size={16} />
          Back to marketplace
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-surface border border-border-subtle rounded-2xl p-8">
              <div className="flex items-start gap-5 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl">
                  {categoryMeta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="text-2xl font-black text-text-primary">{mcpTool.name}</h1>
                    {mcpTool.is_featured && <Badge variant="primary">Featured</Badge>}
                    <Badge variant="success">Approved</Badge>
                  </div>
                  <p className="text-text-secondary">{mcpTool.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="default">{categoryMeta.label}</Badge>
                    <Badge variant="info">v{mcpTool.version}</Badge>
                    {mcpTool.license && <Badge variant="outline">{mcpTool.license}</Badge>}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-surface-2 rounded-xl">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xl font-black text-text-primary">
                      {(mcpTool.avg_rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-muted">{mcpTool.review_count || 0} reviews</p>
                </div>
                <div className="text-center border-x border-border-subtle">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap size={16} className="text-accent" />
                    <span className="text-xl font-black text-text-primary">
                      {formatNumber(mcpTool.usage_count || 0)}
                    </span>
                  </div>
                  <p className="text-xs text-muted">API calls</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Calendar size={16} className="text-primary" />
                    <span className="text-sm font-bold text-text-primary">
                      {formatDate(mcpTool.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted">Published</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            {mcpTool.tags.length > 0 && (
              <div className="bg-surface border border-border-subtle rounded-xl p-6">
                <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Tag size={16} className="text-primary" /> Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {mcpTool.tags.map((tag) => (
                    <Badge key={tag} variant="default">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Long description / docs */}
            {mcpTool.long_description && (
              <div className="bg-surface border border-border-subtle rounded-xl p-6">
                <h2 className="text-base font-semibold text-text-primary mb-4">Documentation</h2>
                <div className="prose prose-invert prose-sm max-w-none text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {mcpTool.long_description}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-surface border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                Reviews ({reviews.length})
              </h2>
              {reviews.length === 0 ? (
                <p className="text-text-secondary text-sm text-center py-8">
                  No reviews yet. Be the first to review this tool!
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="flex gap-4 p-4 bg-surface-2 rounded-xl">
                      <Image
                        src={review.user?.avatar_url || getAvatarUrl(review.user?.name, review.user?.email)}
                        alt={review.user?.name || 'User'}
                        width={36}
                        height={36}
                        className="rounded-full flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-text-primary">
                            {review.user?.name || review.user?.email?.split('@')[0]}
                          </span>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-border-subtle'}
                              />
                            ))}
                          </div>
                        </div>
                        {review.review_text && (
                          <p className="text-sm text-text-secondary">{review.review_text}</p>
                        )}
                        <p className="text-xs text-muted mt-1">{formatDate(review.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Use tool */}
            <div className="bg-surface border border-border-subtle rounded-xl p-6 sticky top-24">
              <h3 className="text-base font-semibold text-text-primary mb-4">Connect this Tool</h3>
              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-xs text-muted mb-1.5 block">MCP Endpoint</label>
                  <div className="flex items-center gap-2 bg-surface-2 border border-border-subtle rounded-lg px-3 py-2">
                    <code className="text-xs text-accent flex-1 truncate font-mono">{mcpTool.api_endpoint}</code>
                    <button className="text-muted hover:text-text-primary transition-colors flex-shrink-0">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button variant="glow" size="md" className="w-full" icon={<Zap size={16} />}>
                  Use This Tool
                </Button>
                {mcpTool.documentation_url && (
                  <a href={mcpTool.documentation_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="md" className="w-full" icon={<ExternalLink size={14} />} iconPosition="right">
                      View Docs
                    </Button>
                  </a>
                )}
                {mcpTool.github_url && (
                  <a href={mcpTool.github_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="md" className="w-full" icon={<Github size={14} />}>
                      GitHub Repo
                    </Button>
                  </a>
                )}
              </div>

              {/* Security note */}
              <div className="mt-4 flex items-start gap-2 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-lg">
                <Shield size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary">This tool has been reviewed and approved by the Eternal MCP team.</p>
              </div>
            </div>

            {/* Creator card */}
            {mcpTool.creator && (
              <div className="bg-surface border border-border-subtle rounded-xl p-6">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Creator</h3>
                <div className="flex items-center gap-3">
                  <Image
                    src={mcpTool.creator.avatar_url || getAvatarUrl(mcpTool.creator.name, mcpTool.creator.email)}
                    alt={mcpTool.creator.name || 'Creator'}
                    width={44}
                    height={44}
                    className="rounded-full"
                  />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {mcpTool.creator.name || mcpTool.creator.email?.split('@')[0]}
                    </p>
                    {mcpTool.creator.github_username && (
                      <a
                        href={`https://github.com/${mcpTool.creator.github_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted hover:text-text-primary transition-colors mt-0.5"
                      >
                        <Globe size={11} />
                        @{mcpTool.creator.github_username}
                      </a>
                    )}
                  </div>
                </div>
                {mcpTool.creator.bio && (
                  <p className="text-sm text-text-secondary mt-3">{mcpTool.creator.bio}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
