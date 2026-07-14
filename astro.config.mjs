import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import vercel from "@astrojs/vercel";

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