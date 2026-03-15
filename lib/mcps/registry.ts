import { GMAIL_MCP_DEFINITION } from './gmail/definition'
import { RESEARCH_MCP_DEFINITION } from './research/definition'
import { STORAGE_MCP_DEFINITION } from './storage/definition'
import { PDF_CREATOR_DEFINITION } from './pdf/definition'
import { DATA_SUMMARY_DEFINITION } from './data-summary/definition'

export const MCP_REGISTRY = [GMAIL_MCP_DEFINITION, RESEARCH_MCP_DEFINITION, STORAGE_MCP_DEFINITION, PDF_CREATOR_DEFINITION, DATA_SUMMARY_DEFINITION] as const

export type McpSlug = (typeof MCP_REGISTRY)[number]['slug']

export function getMcpDefinition(slug: string) {
  return MCP_REGISTRY.find((m) => m.slug === slug) ?? null
}
