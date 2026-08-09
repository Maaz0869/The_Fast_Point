import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Link previews (WhatsApp, Facebook) need an ABSOLUTE og:image URL — a relative
// one is not reliably resolved by their crawlers — and a sitemap may only list
// absolute URLs at all. So the site's own domain has to be known at build time.
//
// VITE_SITE_URL wins, for a custom domain. Otherwise Vercel hands us the
// project's production domain in VERCEL_PROJECT_PRODUCTION_URL (no protocol),
// so a plain deploy gets this right with nothing to configure — and previews
// still point at production, which is what a shared link should open.
const siteUrl = (
  process.env.VITE_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : '')
).replace(/\/+$/, '')

const injectSiteUrl = {
  name: 'inject-site-url',
  transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl),
}

// The pages worth putting in front of a search engine. Everything else is
// either private (admin, account), single-use (checkout, a specific order) or
// has no content of its own (cart, login) — and public/robots.txt already tells
// crawlers to stay out of those.
const SITEMAP_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/menu', changefreq: 'daily', priority: '0.9' },
  { path: '/deals', changefreq: 'daily', priority: '0.9' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/track', changefreq: 'monthly', priority: '0.4' },
]

let outDir = 'dist'

// Writes sitemap.xml and points robots.txt at it. Runs in closeBundle — the
// last hook — because Vite copies public/ into the output during the build, and
// robots.txt has to already be there before we can append to it.
const emitSitemap = {
  name: 'emit-sitemap',
  apply: 'build',
  configResolved(config) {
    outDir = path.resolve(config.root, config.build.outDir)
  },
  closeBundle() {
    // Without a domain every <loc> would be relative, which search engines
    // reject outright — better to ship no sitemap than an invalid one.
    if (!siteUrl) {
      this.warn(
        'No VITE_SITE_URL (and no VERCEL_PROJECT_PRODUCTION_URL) — skipping sitemap.xml.',
      )
      return
    }

    const lastmod = new Date().toISOString().slice(0, 10)
    const urls = SITEMAP_ROUTES.map(
      (r) => `  <url>
    <loc>${siteUrl}${r.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
    ).join('\n')

    fs.writeFileSync(
      path.join(outDir, 'sitemap.xml'),
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
    )

    const robotsPath = path.join(outDir, 'robots.txt')
    if (fs.existsSync(robotsPath)) {
      const robots = fs.readFileSync(robotsPath, 'utf8').replace(/\s*Sitemap:.*/g, '')
      fs.writeFileSync(robotsPath, `${robots.trimEnd()}\n\nSitemap: ${siteUrl}/sitemap.xml\n`)
    }
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), injectSiteUrl, emitSitemap],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        // React, the router and the Supabase client change far less often than
        // the app does. Splitting them out means a normal deploy only
        // invalidates the small app chunk, and a returning customer on mobile
        // data re-downloads a fraction of what they would otherwise.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
