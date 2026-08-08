import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Link previews (WhatsApp, Facebook) need an ABSOLUTE og:image URL — a relative
// one is not reliably resolved by their crawlers. The site's own domain isn't
// known at build time, so it comes from VITE_SITE_URL (set it in Vercel →
// Environment Variables). Without it the tags fall back to relative paths,
// which still work in a browser and simply give a plainer preview card.
const siteUrl = (process.env.VITE_SITE_URL || '').replace(/\/+$/, '')

const injectSiteUrl = {
  name: 'inject-site-url',
  transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl),
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), injectSiteUrl],
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
