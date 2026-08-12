import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vercel from "@astrojs/vercel";
import { LAST_UPDATED, toDate } from './src/lib/page-dates.mjs';

export default defineConfig({
  // CSP graduated from `experimental.csp` to `security.csp` in Astro 6.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https:",
        "font-src 'self' data: https: https://fonts.gstatic.com",
        "connect-src 'self' https://api.buttondown.email https://va.vercel-scripts.com https://vitals.vercel-insights.com",
        "object-src 'none'",
        "base-uri 'self'"
      ],
      styleDirective: {
        resources: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]
      },
      scriptDirective: {
        resources: ["'self'", "https://va.vercel-scripts.com"]
      }
    }
  },
  integrations: [
    // Tailwind 3 now runs through the root postcss.config.js (tailwindcss +
    // autoprefixer), which Vite picks up natively; @astrojs/tailwind has no
    // Astro 6-compatible release. globals.css already carries the @tailwind
    // directives and is imported by Layout.astro.
    react(),
    mdx(),
    // Only emits entries for prerendered routes, so the static content pages
    // each declare `export const prerender = true`. /api/subscribe stays
    // server-rendered and is excluded automatically.
    sitemap({
      // lastmod comes from each page's own "last updated" constant, not the
      // build clock — stamping every page on every deploy would claim edits
      // that never happened. The homepage has no such date, so it gets none.
      serialize(item) {
        if (item.url.endsWith('/privacy/')) {
          item.lastmod = toDate(LAST_UPDATED.privacy);
        } else if (item.url.endsWith('/terms/')) {
          item.lastmod = toDate(LAST_UPDATED.terms);
        }
        return item;
      },
    }),
  ],
  site: 'https://www.legesher.io',
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: true },
    speedInsights: { enabled: true },
  }),
  server: {
    headers: {
      'X-Frame-Options': 'DENY'
    }
  }
}); 