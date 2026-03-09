// ============================================================
// Eternal MCP — Shared TypeScript Types
// ============================================================

export type UserRole = 'user' | 'developer' | 'admin'

export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  role: UserRole
  github_username: string | null
  bio: string | null
  website: string | null
  created_at: string
  updated_at: string
}

export type ToolCategory =
  | 'trading'
  | 'analytics'
  | 'automation'
  | 'data'
  | 'communication'
  | 'security'
  | 'finance'
  | 'research'
  | 'productivity'
  | 'other'

export type ToolStatus = 'pending' | 'approved' | 'rejected' | 'archived'

export interface MCPTool {
  id: string
  name: string
  slug: string
  description: string
  long_description: string | null
  creator_id: string
  api_endpoint: string
  documentation_url: string | null
  category: ToolCategory
  tags: string[]
  version: string
  status: ToolStatus
  is_featured: boolean
  icon_url: string | null
  github_url: string | null
  license: string | null
  created_at: string
  updated_at: string
  // Joined
  creator?: User
  usage_count?: number
  avg_rating?: number
  review_count?: number
}

export interface ToolUsage {
  id: string
  user_id: string
  tool_id: string
  usage_count: number
  last_used: string
  created_at: string
}

export interface Review {
  id: string
  tool_id: string
  user_id: string
  rating: number
  review_text: string | null
  created_at: string
  updated_at: string
  // Joined
  user?: User
}

export interface ApiKey {
  id: string
  user_id: string
  name: string
  key_prefix: string
  key_hash: string
  last_used: string | null
  expires_at: string | null
  created_at: string
}

export interface Category {
  id: ToolCategory
  label: string
  description: string
  icon: string
  count?: number
}

// DTO types for forms
export interface CreateToolInput {
  name: string
  description: string
  long_description?: string
  api_endpoint: string
  documentation_url?: string
  category: ToolCategory
  tags: string[]
  version: string
  github_url?: string
  license?: string
}

export interface UpdateToolInput extends Partial<CreateToolInput> {
  id: string
}

export interface CreateReviewInput {
  tool_id: string
  rating: number
  review_text?: string
}

// API response types
export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

// Dashboard analytics
export interface ToolAnalytics {
  tool_id: string
  total_usage: number
  unique_users: number
  avg_rating: number
  review_count: number
  usage_by_day: { date: string; count: number }[]
  top_users: { user: User; usage_count: number }[]
}

export interface DashboardStats {
  total_tools: number
  total_usage: number
  avg_rating: number
  total_reviews: number
}
