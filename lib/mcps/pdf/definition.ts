// PDF Creator MCP — Definition

export const PDF_CREATOR_DEFINITION = {
  slug: 'pdf-creator',
  name: 'PDF Creator',
  description: 'Convert markdown, plain text, or basic HTML into a professional branded PDF. Say "create a PDF of this" after any Claude-generated content.',
  icon: '📄',
  category: 'productivity',
  version: '1.0.0',
  author: 'EternalMCP',
  verified: true,
  rating: 5.0,
  installs: 0,
  tags: ['pdf', 'document', 'convert', 'export', 'markdown'],
  oauth_provider: null as null,
  oauth_scopes: [] as string[],
  requiresOAuth: false,
  creditCost: 0,
  permissions: [
    { label: 'Convert markdown and plain text to PDF', granted: true },
    { label: 'Convert basic HTML to PDF', granted: true },
    { label: 'Store PDF and return a 24-hour download link', granted: true },
    { label: 'Access your personal accounts or data', granted: false },
    { label: 'Convert Word, Excel, or PowerPoint files', granted: false },
  ],
  tools: [
    {
      name: 'create_pdf',
      description: `Convert markdown, plain text, or basic HTML content into a PDF file. Returns a 24-hour download link.

SUPPORTED FORMATS:
- Markdown (headings, bold, italic, bullet lists, tables)
- Plain text
- Basic HTML (h1-h6, p, ul/ol, li, strong, em, br, table)

NOT SUPPORTED — return an error if user provides:
- Word (.docx), Excel (.xlsx), PowerPoint (.pptx) files
- Binary or base64-encoded file content
- Already-existing PDF files

If a user attaches a Word or Excel file, tell them: "I can extract the text content and convert it to PDF. Please ask me to read the file content first, then I'll pass the text to create_pdf."`,
      inputSchema: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'The markdown, plain text, or basic HTML content to convert to PDF. Must be readable text — not base64 or binary data.',
          },
          filename: {
            type: 'string',
            description: 'Name for the output file without extension (e.g. "company-report", "meeting-notes"). A .pdf extension will be added automatically.',
          },
          title: {
            type: 'string',
            description: 'Optional title shown in the PDF header. Defaults to the filename if not provided.',
          },
        },
        required: ['content', 'filename'],
      },
    },
  ],
} as const
