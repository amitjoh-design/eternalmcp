import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PostHogProvider } from '@/components/PostHogProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Eternal MCP — The Infrastructure Layer for AI Tools',
    template: '%s | Eternal MCP',
  },
  description:
    'Discover, publish, and integrate Model Context Protocol (MCP) tools. The central marketplace for AI automation tools that connect LLMs to real-world actions.',
  keywords: [
    'MCP', 'Model Context Protocol', 'AI tools', 'LLM tools', 'AI automation',
    'API marketplace', 'trading bots', 'AI infrastructure',
  ],
  authors: [{ name: 'Eternal MCP' }],
  creator: 'Eternal MCP',
  metadataBase: new URL('https://www.eternalmcp.com'),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://eternalmcp.com',
    siteName: 'Eternal MCP',
    title: 'Eternal MCP — The Infrastructure Layer for AI Tools',
    description:
      'The central marketplace for MCP tools. Connect your AI models to powerful tools for trading, analytics, automation, and more.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eternal MCP',
    description: 'The Infrastructure Layer for AI Tools',
    images: ['/og-image.png'],
    creator: '@eternalmcp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-background text-text-primary antialiased">
        <PostHogProvider>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#111118',
              color: '#f1f5f9',
              border: '1px solid #2a2a3e',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#22d3ee', secondary: '#111118' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#111118' },
            },
          }}
        />
        </PostHogProvider>
      </body>
    </html>
  )
}
