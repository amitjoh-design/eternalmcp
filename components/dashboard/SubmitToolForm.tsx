'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Plus, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/utils'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50),
  description: z.string().min(20, 'Description must be at least 20 characters').max(300),
  long_description: z.string().optional(),
  api_endpoint: z.string().url('Must be a valid URL'),
  documentation_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  category: z.string().min(1, 'Select a category'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be semver format (e.g. 1.0.0)'),
  github_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  license: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const CATEGORY_OPTIONS = [
  { value: '', label: 'Select category...' },
  ...Object.entries(CATEGORIES).map(([value, meta]) => ({
    value,
    label: `${meta.icon} ${meta.label}`,
  })),
]

const LICENSE_OPTIONS = [
  { value: '', label: 'No license' },
  { value: 'MIT', label: 'MIT' },
  { value: 'Apache-2.0', label: 'Apache 2.0' },
  { value: 'GPL-3.0', label: 'GPL 3.0' },
  { value: 'BSD-3-Clause', label: 'BSD 3-Clause' },
  { value: 'Commercial', label: 'Commercial' },
]

interface SubmitToolFormProps {
  onSuccess?: () => void
}

export function SubmitToolForm({ onSuccess }: SubmitToolFormProps) {
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { version: '1.0.0' },
  })

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag) && tags.length < 8) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag))

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('mcp_tools').insert({
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        description: data.description,
        long_description: data.long_description || null,
        api_endpoint: data.api_endpoint,
        documentation_url: data.documentation_url || null,
        category: data.category,
        tags,
        version: data.version,
        github_url: data.github_url || null,
        license: data.license || null,
        creator_id: user.id,
        status: 'pending',
        is_featured: false,
      })

      if (error) throw error

      toast.success('Tool submitted for review! We\'ll review it within 24 hours.')
      reset()
      setTags([])
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit tool')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {/* Notice */}
      <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl">
        <AlertCircle size={18} className="text-primary flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-text-primary font-medium">Review Required</p>
          <p className="text-text-secondary mt-0.5">
            All submitted tools go through a review process before appearing in the marketplace. This typically takes 1-2 business days.
          </p>
        </div>
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Tool Name *"
          placeholder="e.g., Trading Analytics MCP"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Version *"
          placeholder="1.0.0"
          error={errors.version?.message}
          {...register('version')}
        />
      </div>

      <Textarea
        label="Short Description *"
        placeholder="A brief description of what your MCP tool does (max 300 chars)"
        rows={3}
        error={errors.description?.message}
        hint="This appears in tool cards and search results"
        {...register('description')}
      />

      <Textarea
        label="Full Documentation / Long Description"
        placeholder="Detailed documentation, usage examples, configuration options..."
        rows={6}
        error={errors.long_description?.message}
        hint="Supports Markdown formatting"
        {...register('long_description')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Category *"
          options={CATEGORY_OPTIONS}
          error={errors.category?.message}
          {...register('category')}
        />
        <Select
          label="License"
          options={LICENSE_OPTIONS}
          {...register('license')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="API Endpoint *"
          placeholder="https://api.yourdomain.com/mcp"
          error={errors.api_endpoint?.message}
          hint="The MCP-compatible endpoint URL"
          {...register('api_endpoint')}
        />
        <Input
          label="Documentation URL"
          placeholder="https://docs.yourdomain.com"
          error={errors.documentation_url?.message}
          {...register('documentation_url')}
        />
      </div>

      <Input
        label="GitHub Repository"
        placeholder="https://github.com/username/repo"
        error={errors.github_url?.message}
        {...register('github_url')}
      />

      {/* Tags */}
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-1.5">
          Tags <span className="text-muted">(up to 8)</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
            placeholder="Add a tag..."
            className="flex-1 bg-surface-2 border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-muted focus:outline-none focus:border-primary"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addTag}
            disabled={!tagInput.trim() || tags.length >= 8}
            icon={<Plus size={16} />}
          >
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="primary" size="md" className="gap-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-4 border-t border-border-subtle">
        <Button
          type="submit"
          variant="glow"
          size="lg"
          loading={loading}
          icon={loading ? undefined : <CheckCircle size={18} />}
          className="flex-1"
        >
          {loading ? 'Submitting...' : 'Submit for Review'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => { reset(); setTags([]) }}
        >
          Clear
        </Button>
      </div>
    </motion.form>
  )
}
