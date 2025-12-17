# Security

## Known Dependencies

### npm audit findings (as of 2025-12-17)

**Status**: Monitoring for fix

**Issue**: High severity vulnerability in `path-to-regexp@6.1.0` (CVE-2024-45296)
- **CVSS Score**: 7.5 (High)
- **Vulnerability**: Backtracking regular expressions cause ReDoS
- **Affected versions**: path-to-regexp 4.0.0 - 6.2.2
- **Fixed in**: path-to-regexp 6.3.0+
- **Advisory**: https://github.com/advisories/GHSA-9wv6-86v2-598j

**Dependency chain**:
```
@astrojs/vercel@8.2.11
└── @vercel/routing-utils@5.3.1
    └── path-to-regexp@6.1.0
```

**Risk assessment**: Low practical risk
- Site uses standard routing patterns (not vulnerable regex patterns)
- Vercel infrastructure provides WAF protection
- Dual rate limiting (5 req/hour) protects against DoS
- Newsletter form uses simple `/api/subscribe` endpoint

**Resolution plan**:
- Waiting for Astro team to release patched version
- Monitoring `@astrojs/vercel` package for updates
- Alternative: Run `npm audit fix --force` (breaks compatibility, downgrades to v8.0.4)

**Next check date**: 2025-12-24 (1 week)

---

## Security Measures Implemented

### Newsletter Form (`/api/subscribe`)

**Input Validation**:
- ✅ Email format validation (regex)
- ✅ Name format validation (supports international characters)
- ✅ Type checking for all inputs
- ✅ Length limits (150 characters for firstName/email)
- ✅ XSS prevention (HTML tag stripping)

**Anti-Bot Protection**:
- ✅ Honeypot field (hidden from humans)
- ✅ Dual rate limiting (IP + email based, 5 req/hour)
- ✅ Double opt-in email confirmation

**Privacy & Compliance**:
- ✅ GDPR-compliant consent messaging
- ✅ IP address collection for spam detection (disclosed)
- ✅ Unsubscribe functionality via Buttondown
- ✅ Minimal data collection (email + firstName only)

**Data Protection**:
- ✅ No sensitive data logged in production
- ✅ Server-side validation before Buttondown API call
- ✅ Secure headers (Content-Type, Retry-After)

---

## Reporting Security Issues

If you discover a security vulnerability, please email security@legesher.io (or contact via GitHub issues for non-critical findings).

**Please include**:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We aim to respond within 48 hours and will keep you updated on the resolution progress.
