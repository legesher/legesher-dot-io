# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **One layout for the legal pages.** The Terms and the Privacy Policy are written in Markdown
  (`src/content/legal`) and share one layout: the title and a "Download PDF" button at the top, a
  numbered list of sections beside the text, and the document's details (last updated, type with
  its icon, an "All users" audience tag and language). On a phone the list folds into "On
  this page", and a table wider than the text scrolls inside its own box. Each document opens with
  its introduction and no heading above it.
- **Paid plans, canceling and refunds in the Terms (Sections 4 to 6).** Payments through Polar as
  merchant of record, canceling and refunds, failed payments and ending a plan. `/refunds`
  redirects to Section 5. `src/lib/page-dates.test.ts` guards that
  every dated page reads its own `LAST_UPDATED` entry and that every entry is an ISO date the
  formatter renders.
- **PostHog newsletter funnel, behind a build-time key.** `public/scripts/analytics.js` is rendered
  by the layout only when the build carries `PUBLIC_POSTHOG_KEY`, and the Content Security Policy
  gains PostHog's origin only in that case. Memory-only persistence (no cookie, no client-side
  storage), no autocapture, pageviews, session recording, surveys or feature flags, Do Not Track
  respected, PostHog's own campaign and first-touch collection off. Five events: the newsletter form
  in view, the submit, the successful subscription (then identify by email), a Docs link click, and a
  corpus link click that no link carries yet. Two guards: `src/lib/analytics-csp.test.ts` (every
  built page has the loader exactly when the policy allows it) and `src/lib/analytics-loader.test.ts`
  (each privacy-page promise pinned to the option that keeps it). Without the key the built pages
  differ only by a `data-track` attribute on the two Docs links. `tsconfig.json` now includes the
  generated `.astro/types.d.ts`, so `astro check` can type `astro:env` imports.

### Changed

- **Terms of Service, rewritten.** A contract with Legesher Global Tech Ltd, governed by DIFC law
  with disputes in the DIFC Courts and a consumer's local rights kept. The Terms open with "At a
  glance" and run in 17 numbered sections of numbered clauses: these Terms, your account, plans,
  payments, canceling and refunds, failed payments, acceptable use, your code and the Legesher
  vocabulary, suspension, intellectual property, disclaimers, liability, indemnification,
  changes, governing law, general, and contact. One contact address, support@legesher.com. No
  plan offers a license to extract the vocabulary, train on it or redistribute it in bulk; those
  need a separate written data agreement. The open-source software, the language corpus and the
  documentation are covered by their own licenses.
- **Fonts served from the site.** The Noto fonts come from the `@fontsource-variable` packages
  (exact-pinned) in place of Google Fonts, so a page view sends nothing to a font service, and the
  Content Security Policy no longer allows Google's font and stylesheet origins.
  `src/lib/self-hosted-fonts.test.ts` fails if any source file or built page names Google Fonts.
- **Privacy Policy, rewritten.** Legesher Global Tech Ltd is responsible for personal data, under
  the DIFC Data Protection Law. The policy opens with "At a glance" and covers what is collected
  and why (with a legal basis for each), the code you send (not logged, not kept, not used for
  training), the sign-in cookies on the account app (none on the website), sharing, where data is
  handled, how long it is kept, contributed translations, your rights, children, security and
  changes, with the service providers in Appendix A and the EEA and UK in Appendix B. One contact
  address, support@legesher.com.
- **Upgraded the site framework to Astro 6 and React 19** (astro ^6.4.8, react/react-dom ^19.2.7,
  @astrojs/react ^5, @astrojs/mdx ^6, @astrojs/vercel ^10, @vercel/analytics ^2; Node floor
  raised to >=22.12.0). One code change applied: CSP configuration graduated from
  `experimental.csp` to `security.csp`.
- Removed the `@astrojs/tailwind` integration (no release supports Astro 6); Tailwind 3 now
  loads through the repo's existing `postcss.config.js`, which Astro/Vite picks up natively —
  no CSS changes. The Tailwind 4 migration is deferred as its own project.

### Security

- **Cleared all 6 high and both moderate npm-audit advisories** (6 high / 2 moderate / 6 low →
  0 / 0 / 4). Includes five Astro HIGHs — the `define:vars` XSS (GHSA-j687-52p2-xcff),
  spread-props XSS, slot-name XSS, server-island replay, and SSRF — plus the `x-astro-path`
  override via @astrojs/vercel 10. Scoped npm overrides pin `path-to-regexp` to the patched
  6.3.0 (revisit at Astro 7) and `tmp` to ^0.2.6. The remaining 4 lows are the esbuild
  dev-server advisory pinned by astro itself; no fix exists in the 6.x line.

### Added

- **Campaign attribution on newsletter subscriptions.** When someone reaches the site through a
  link carrying `utm_source` / `utm_campaign`, those values are recorded with their subscription
  as `last_touch_channel` and `last_touch_release`, so an announcement can be credited with the
  signups it produced. Read from the subscribing page's address and never stored on the visitor's
  device, keeping the policy's no-client-side-storage commitment intact. A visit carrying no
  campaign parameters records nothing at all rather than a placeholder, so "not measured" stays
  distinguishable from "arrived directly". Disclosed in the Privacy Policy.
- Company-wide **Privacy Policy** at [/privacy](https://www.legesher.io/privacy) covering website, products,
  community, data retention, and full GDPR/CCPA/CPRA/state privacy law disclosures (CORE-542, CORE-581)
- **Terms of Service** at [/terms](https://www.legesher.io/terms) documenting the open-core licensing
  model (Apache 2.0 for code; Commercial License for Hosted Services, Curated Datasets, Curriculum),
  four disclaimers, governing law, and contact routing (CORE-889)
- Footer legal row linking to Privacy Policy and Terms of Service site-wide
- `/.well-known/security.txt` (RFC 9116) exposing `support@legesher.com` as the vulnerability
  reporting contact
- Canonical URL and `robots` meta tags on every page for consistent search-engine indexing
- Astro `site` configured to `https://www.legesher.io` (matches the CNAME and the hostname used by
  security.txt and the privacy/terms docs)
- **Mobile navigation** &mdash; a menu button below the `md` breakpoint opens the same links as the
  desktop nav. The header nav was previously hidden on phones with nothing in its place, leaving the
  footer as the only route to any page. Closes on `Esc` and returns focus to the button (CORE-1601)
- **XML sitemap** at [/sitemap-index.xml](https://www.legesher.io/sitemap-index.xml) listing every
  public content page, and a `Sitemap:` directive in `robots.txt`. `@astrojs/sitemap` had been a
  dependency for some time but was never registered, so no sitemap existed for any page (CORE-1530)
- **Social preview images** &mdash; `og:image`, `twitter:image`, `og:url` and alt text, so a shared
  link renders a card. `twitter:card` was already set to `summary_large_image` but no image was ever
  supplied (CORE-1530)

### Changed

- Newsletter subscription disclosure clarifies that the visitor IP address is forwarded (server-side) to
  Buttondown as part of the subscription payload for their spam prevention
- Layout passes `canonical` and `robots` meta through `Astro.site`; no per-page changes needed
- Pages are **static by default** (`output: 'static'`). `/`, `/privacy` and `/terms` are prerendered
  and served from the CDN rather than invoking a serverless function on every request;
  `/api/subscribe` stays server-rendered
- **`legesher.io` now redirects to `www.legesher.io`** (301). Both hosts previously answered 200, so
  every page existed at two addresses. www was already the canonical form in the CNAME and in the
  `<link rel="canonical">` both hosts served
- Sitemap `lastmod` for `/privacy` and `/terms` reflects each document's own last-updated date rather
  than the time of the build

### Removed

- Unused Upstash-based rate limiting from `src/pages/api/subscribe.ts`. The `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN` env vars were never configured, so the rate limiter silently fell back to
  "allow all" &mdash; dead code creating a misleading privacy disclosure. Follow-up tracked in CORE-882
  to re-add proper rate limiting if spam pressure appears.

### Fixed

- **Call-to-action buttons render as a single `<a>`** rather than a `<button>` nested inside one.
  Nesting one interactive element in another is invalid HTML5 and leaves keyboard focus order and
  activation semantics undefined for assistive technology. Appearance is unchanged (CORE-1600)
- Slack invite links in the header and footer pointed at a different Slack workspace than the one
  `/go/slack` redirects to; every copy now uses the same invite

### Security

- Privacy Policy documents a zero-cookie posture: no cookies, no `localStorage` writes, no consent banner
  required under GDPR or the ePrivacy Directive
- Terms of Service caps liability (greater of twelve-month paid amount or USD $100)

## [2.0.0] - 2025-12-18

### Added

- Complete website redesign with Astro 5 + React + Tailwind CSS
- Newsletter subscription powered by Buttondown API
- Interactive code editor demo
- Comprehensive security measures (rate limiting, honeypot, validation)
- CHANGELOG.md for tracking project history
- All-contributors integration with contributor photos

### Changed

- Migrated from legacy static site to Astro framework
- Discord community → Slack community
- Twitter → X branding
- GitHub Sponsors: personal → Legesher organization

### Removed

- Unused Vite configuration (Astro handles internally)
- Unused ESLint configuration
- Duplicate TypeScript configurations
- Legacy README

### Security

- Rate limiting on newsletter API (5 req/hour per IP and email)
- Honeypot field for bot protection
- Server-side input validation with XSS prevention
- GDPR-compliant consent messaging
- IP address forwarding to Buttondown for spam detection
