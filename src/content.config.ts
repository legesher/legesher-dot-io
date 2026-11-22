import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// The legal documents: one MDX file each, rendered by src/layouts/LegalLayout.astro
// through a thin page in src/pages. The date is not here; it is
// LAST_UPDATED[<id>] in src/lib/page-dates.mjs, which the sitemap reads too.
const legal = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    type: z.enum(['Terms', 'Policy']),
    // Who the document is for, as tags: Individual, Business or both.
    audience: z.array(z.enum(['Individual', 'Business'])).nonempty(),
    entity: z.string(),
  }),
});

export const collections = { legal };
