// Single source for each page's date, which a legal page shows as "Effective".
//
// Consumed twice: the page renders it as human-readable text, and
// astro.config.mjs emits it as <lastmod> in the sitemap. Keeping one constant
// means the sitemap cannot silently go stale when a policy is revised.
//
// Plain .mjs (not .ts) so astro.config.mjs can import it directly.
//
// ISO 8601, UTC.
export const LAST_UPDATED = {
  cookies: '2026-11-26',
  privacy: '2026-11-26',
  terms: '2026-11-26',
  'usage-policy': '2026-11-26',
};

/** '2026-08-10' -> 'August 10, 2026'. The sitemap consumes the ISO form directly. */
export function formatLastUpdated(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
