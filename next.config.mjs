/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr', 'pdfkit'],
  },
  // Include pdfkit font data files in Vercel serverless bundle
  outputFileTracingIncludes: {
    '/api/mcp/**': [
      './node_modules/pdfkit/js/data/**/*',
      './node_modules/pdfkit/js/font/**/*',
    ],
  },
}

export default nextConfig
