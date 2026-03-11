// Company Research MCP — Definition
// Generates institutional-grade equity research reports as PDF using Claude AI

export const RESEARCH_MCP_DEFINITION = {
  slug: 'company-research',
  name: 'Company Research',
  description: 'Generate institutional-grade equity research reports as PDF. Powered by Claude AI. Each report covers sector analysis, financials, valuation, investment thesis and risk factors.',
  icon: '📊',
  category: 'research',
  version: '1.0.0',
  author: 'EternalMCP',
  verified: true,
  rating: 5.0,
  installs: 0,
  tags: ['research', 'finance', 'equity', 'analysis', 'pdf', 'investment'],
  oauth_provider: null as null, // No OAuth — uses platform credits or user API key
  oauth_scopes: [] as string[],
  requiresOAuth: false,
  creditCost: 25, // ₹25 per report (deducted from user credits)
  permissions: [
    { label: 'Generate equity research reports using Claude AI', granted: true },
    { label: 'Create and download PDF reports', granted: true },
    { label: 'Use your credit balance (₹25 per report)', granted: true },
    { label: 'Access your personal accounts or data', granted: false },
    { label: 'Store report data beyond PDF file', granted: false },
  ],
  tools: [
    {
      name: 'research_company',
      description: 'Generate an institutional-grade equity research report for a publicly listed company. Returns a 7-day PDF download link and a text summary of the report. Costs ₹25 from your credit balance (or use your own Anthropic API key).',
      inputSchema: {
        type: 'object',
        properties: {
          company_name: {
            type: 'string',
            description: 'Full company name (e.g. "Reliance Industries Limited", "Apple Inc.", "HDFC Bank")',
          },
          exchange: {
            type: 'string',
            description: 'Stock exchange where the company is listed (e.g. NSE, BSE, NYSE, NASDAQ, LSE, SGX)',
          },
          user_api_key: {
            type: 'string',
            description: 'Your own Anthropic API key (optional — if provided, no credits are deducted from your balance)',
          },
        },
        required: ['company_name', 'exchange'],
      },
    },
  ],
} as const
