# Security

## Reporting Security Issues

If you discover a security vulnerability, please email security@legesher.com (or contact via GitHub issues for non-critical findings).

**Please include**:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We aim to respond within 48 hours and will keep you updated on the resolution progress.

---

## Security Measures Implemented

### Newsletter Form (`/api/subscribe`)

**Input Validation**:
- Email format validation (regex)
- Name format validation (supports international characters)
- Type checking for all inputs
- Length limits (150 characters for firstName/email)
- XSS prevention (HTML tag stripping)

**Anti-Bot Protection**:
- Honeypot field (hidden from humans)
- Dual rate limiting (IP + email based, 5 req/hour)
- Double opt-in email confirmation

**Privacy & Compliance**:
- GDPR-compliant consent messaging
- IP address collection for spam detection (disclosed)
- Unsubscribe functionality via Buttondown
- Minimal data collection (email + firstName only)

**Data Protection**:
- No sensitive data logged in production
- Server-side validation before Buttondown API call
- Secure headers (Content-Type, Retry-After)

---

## Dependency Security

We regularly monitor dependencies for security vulnerabilities using `npm audit`. Known issues are tracked internally and addressed as patches become available.

To check the current status:
```bash
npm audit
```
