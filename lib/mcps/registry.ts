import { GMAIL_MCP_DEFINITION } from './gmail/definition'
import { RESEARCH_MCP_DEFINITION } from './research/definition'
import { STORAGE_MCP_DEFINITION } from './storage/definition'

export const MCP_REGISTRY = [GMAIL_MCP_DEFINITION, RESEARCH_MCP_DEFINITION, STORAGE_MCP_DEFINITION] as const

export type McpSlug = (typeof MCP_REGISTRY)[number]['slug']

export function getMcpDefinition(slug: string) {
  return MCP_REGISTRY.find((m) => m.slug === slug) ?? null
}
