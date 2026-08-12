import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vercel from "@astrojs/vercel";
import { LAST_UPDATED } from './src/lib/page-dates.mjs';

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
    // Only emits prerendered routes. /api/subscribe opts out via
    // `prerender = false` and is excluded automatically.
    sitemap({
      // lastmod comes from each page's own "last updated" date, not the build
      // clock — stamping every page on every deploy would claim edits that
      // never happened. Pages absent from LAST_UPDATED get no lastmod.
      serialize(item) {
        const slug = new URL(item.url).pathname.replaceAll('/', '');
        if (LAST_UPDATED[slug]) item.lastmod = LAST_UPDATED[slug];
        return item;
      },
    }),
  ],
  site: 'https://www.legesher.io',
  // Static by default so a new page is crawlable and CDN-served without having
  // to remember a flag; routes needing the server opt out with
  // `export const prerender = false` (see src/pages/api/subscribe.ts).
  output: 'static',
  // Keep URLs bare. Prerendering defaults to directory format, which would make
  // Astro.url.pathname '/privacy/' and push a trailing slash into the canonical
  // tag, og:url and the sitemap — while every internal link, and the URL already
  // indexed, is '/privacy'.
  trailingSlash: 'never',
  build: { format: 'file' },
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