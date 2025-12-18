# Security

## Reporting Security Issues

If you discover a security vulnerability, please email [support@legesher.com](mailto:support@legesher.com) or report it via [GitHub Security Advisories](https://github.com/Legesher/legesher-dot-io/security/advisories/new).

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
- ✅ All API keys stored in environment variables (not in code)

---

## Dependency Security

We regularly monitor and update dependencies to address security issues as patches become available.

To check the current dependency status:

```bash
npm audit
```

Known vulnerabilities and their resolution status are tracked in our internal issue tracker. We prioritize security patches based on practical risk assessment and maintain monitoring for upstream fixes.

---

## Responsible Disclosure

We follow responsible disclosure practices:

- Security researchers are credited (with permission) for their findings
- We provide reasonable time for fixes before public disclosure
- Critical vulnerabilities are addressed within 48-72 hours
- Users are notified of security updates via release notes

---

## Security Best Practices for Contributors

**When contributing code:**

- Never commit API keys, tokens, or credentials
- Use environment variables for sensitive configuration
- Validate all user inputs on the server side
- Follow OWASP Top 10 security guidelines
- Test with malicious inputs before submitting PRs

**Environment Variables:**

- All secrets must be stored in `.env` (gitignored)
- Use `.env.example` for documentation (placeholders only)
- Reference secrets via `import.meta.env.*` in code

---

## Security Updates

Security-related changes are documented in:

- Release notes (tagged as `[Security]`)
- Pull requests (labeled `security`)
- This SECURITY.md file (updated as needed)

For questions about our security practices, contact [support@legesher.com](mailto:support@legesher.com).
