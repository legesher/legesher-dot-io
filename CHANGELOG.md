# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Company-wide **Privacy Policy** at [/privacy](https://www.legesher.io/privacy) covering website, products,
  community, data retention, and full GDPR/CCPA/CPRA/state privacy law disclosures (CORE-542, CORE-581)
- **Terms of Service** at [/terms](https://www.legesher.io/terms) documenting the open-core licensing
  model (Apache 2.0 for code; Commercial License for Hosted Services, Curated Datasets, Curriculum),
  four disclaimers, Delaware governing law, and contact routing (CORE-889)
- Footer legal row linking to Privacy Policy and Terms of Service site-wide
- `/.well-known/security.txt` (RFC 9116) exposing `security@legesher.com` as the canonical vulnerability
  reporting contact
- Canonical URL and `robots` meta tags on every page for consistent search-engine indexing
- Explicit GDPR-style opt-in checkbox on the newsletter subscription form linking to the Privacy Policy

### Changed

- Newsletter subscription disclosure clarifies that the visitor IP address is forwarded (server-side) to
  Buttondown as part of the subscription payload for their spam prevention
- Layout passes `canonical` and `robots` meta through `Astro.site`; no per-page changes needed

### Removed

- Unused Upstash-based rate limiting from `src/pages/api/subscribe.ts`. The `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN` env vars were never configured, so the rate limiter silently fell back to
  "allow all" &mdash; dead code creating a misleading privacy disclosure. Follow-up tracked in CORE-882
  to re-add proper rate limiting if spam pressure appears.

### Security

- Privacy Policy documents a zero-cookie posture: no cookies, no `localStorage` writes, no consent banner
  required under GDPR or the ePrivacy Directive
- Terms of Service caps liability (greater of twelve-month paid amount or USD $100) and includes AAA
  arbitration for US users (individual only, no class actions)
- Dedicated `security@legesher.com` contact route, exposed via `/.well-known/security.txt`

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
