import Link from 'next/link'
import { Zap, Github, Twitter, Globe, ExternalLink } from 'lucide-react'

const FOOTER_LINKS = {
  Platform: [
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Documentation', href: '/docs' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Status', href: '/status' },
  ],
  Developers: [
    { label: 'Publish Tool', href: '/dashboard' },
    { label: 'API Reference', href: '/docs/api' },
    { label: 'MCP Protocol', href: '/docs/mcp' },
    { label: 'GitHub', href: 'https://github.com/amitjoh-design/eternalmcp' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
}

const ECOSYSTEM_LINKS = [
  { label: 'EternalQuants', href: 'https://eternalquants.com', description: 'Quantitative trading research' },
  { label: 'Gnosis Tech Advisors', href: 'https://gnosistechadvisors.com', description: 'Enterprise IT advisory' },
]

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-surface/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold text-text-primary">
                Eternal<span className="text-primary">MCP</span>
              </span>
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed mb-3 max-w-xs">
              India&apos;s only Claude-dedicated MCP platform. Bringing Constitutional AI to 1.4 billion people — zero code required.
            </p>
            <p className="text-xs text-muted mb-5">
              Under{' '}
              <a
                href="https://gnosistechadvisors.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-light transition-colors"
              >
                Gnosis Tech Advisors
              </a>
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/amitjoh-design/eternalmcp"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
              >
                <Github size={18} />
              </a>
              <a
                href="https://twitter.com/eternalmcp"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://eternalmcp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
              >
                <Globe size={18} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Ecosystem band */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-primary/5 border border-primary/10 rounded-xl mb-8">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider flex-shrink-0">
            Ecosystem
          </span>
          <div className="flex flex-wrap gap-6">
            {ECOSYSTEM_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors group"
              >
                <span className="font-medium">{link.label}</span>
                <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs text-muted">· {link.description}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border-subtle">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p className="text-sm text-muted">
              © {new Date().getFullYear()} EternalMCP · Gnosis Tech Advisors. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
              <span className="text-xs text-orange-300">🇮🇳 Built for Bharat</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-muted">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
