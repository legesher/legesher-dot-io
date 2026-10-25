import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vercel from "@astrojs/vercel";
import { loadEnv } from 'vite';
import { LAST_UPDATED } from './src/lib/page-dates.mjs';

// The PostHog loader (public/scripts/analytics.js) is rendered by Layout.astro
// only when PUBLIC_POSTHOG_KEY is set at build time, and the policy is widened
// to PostHog's origin only in that same case, so a build without the key is
// not opened to a script it does not load (CORE-1948). loadEnv reads the same
// sources astro:env does (the environment and the .env files), so the two
// halves cannot disagree; src/lib/analytics-csp.test.ts checks that on every
// built page. The wildcard is PostHog's documented policy: its asset and
// ingestion hosts are subdomains it reserves the right to move.
const { PUBLIC_POSTHOG_KEY } = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_');
const analyticsOrigins = PUBLIC_POSTHOG_KEY ? ['https://*.posthog.com'] : [];

export default defineConfig({
  // CSP graduated from `experimental.csp` to `security.csp` in Astro 6.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https:",
        "font-src 'self' data: https: https://fonts.gstatic.com",
        ["connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com", ...analyticsOrigins].join(' '),
        "object-src 'none'",
        "base-uri 'self'"
      ],
      styleDirective: {
        resources: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]
      },
      scriptDirective: {
        resources: ["'self'", "https://va.vercel-scripts.com", ...analyticsOrigins]
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
  // BUTTONDOWN_API_KEY is read at request time through astro:env (getSecret in
  // src/pages/api/subscribe.ts), never through a build-time environment read,
  // which the build replaces with a literal: the key baked into the bundle, or
  // undefined when it ran without the variable (CORE-2193). `optional` keeps Astro from
  // throwing at module load when the variable is absent, so the route itself
  // can answer with its documented error and log which variable is missing.
  env: {
    schema: {
      BUTTONDOWN_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      // PostHog project token (CORE-1948). Public by design: it is inlined
      // into the page as the loader's data attribute. Absent, the loader is
      // not rendered and the policy below is not widened.
      PUBLIC_POSTHOG_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
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