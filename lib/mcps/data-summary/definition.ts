// Data Summary MCP — Definition

export const DATA_SUMMARY_DEFINITION = {
  slug: 'data-summary',
  name: 'Data Summary',
  description: 'Turn any CSV or tabular data into a stunning interactive BI dashboard. Auto-detects columns, builds charts, and lets you run what-if scenario analysis — no code needed.',
  icon: '📊',
  category: 'productivity',
  version: '1.0.0',
  author: 'EternalMCP',
  verified: true,
  rating: 5.0,
  installs: 0,
  tags: ['analytics', 'dashboard', 'csv', 'charts', 'business intelligence'],
  oauth_provider: null as null,
  oauth_scopes: [] as string[],
  requiresOAuth: false,
  creditCost: 0,
  permissions: [
    { label: 'Accept CSV data and build interactive dashboards', granted: true },
    { label: 'Generate charts, KPI cards, and scenario planners', granted: true },
    { label: 'Store dashboard and return a 24-hour view link', granted: true },
    { label: 'Access your personal accounts or external data', granted: false },
    { label: 'Connect to external databases or APIs', granted: false },
  ],
  tools: [
    {
      name: 'create_dashboard',
      description: `Build a complete interactive Business Intelligence Dashboard from CSV data.

WHAT IT DOES:
- Auto-detects column types (numeric, date, categorical)
- Splits data by primary category (e.g. Income vs Expense)
- Builds KPI cards, donut charts, bar charts, line/trend charts, ranked bars
- Adds live filter panel and drill-down interactions
- Generates a Scenario Planner page with what-if sliders
- Returns a 24-hour link to the live interactive dashboard

HOW TO USE:
1. User pastes CSV data or describes their spreadsheet
2. Call create_dashboard with the raw CSV text
3. Returns a clickable URL — user opens it in browser

If the user hasn't provided CSV yet, ask them to paste it or describe what data they have.
If no csv_data is provided, the demo bank statement dashboard is generated.`,
      inputSchema: {
        type: 'object',
        properties: {
          csv_data: {
            type: 'string',
            description: 'Raw CSV text to visualize. Include the header row. If omitted, a demo bank statement dashboard is generated.',
          },
          title: {
            type: 'string',
            description: 'Optional title for the dashboard (e.g. "Q1 Sales Report", "Monthly Bank Statement"). Auto-detected from data if not provided.',
          },
        },
        required: [],
      },
    },
  ],
} as const
