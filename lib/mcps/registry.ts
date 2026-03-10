import { GMAIL_MCP_DEFINITION } from './gmail/definition'

export const MCP_REGISTRY = [GMAIL_MCP_DEFINITION] as const

export type McpSlug = (typeof MCP_REGISTRY)[number]['slug']

export function getMcpDefinition(slug: string) {
  return MCP_REGISTRY.find((m) => m.slug === slug) ?? null
}
