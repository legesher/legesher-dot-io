import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import vercel from "@astrojs/vercel";

export default defineConfig({
  experimental: {
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
    tailwind(),
    react(),
    mdx(),
  ],
  site: 'https://legesher.io',
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