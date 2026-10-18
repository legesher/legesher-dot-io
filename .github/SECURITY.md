# Security

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for this repository: the Security tab, then "Report a vulnerability". It keeps the report private until a fix is published. Please include a description, steps to reproduce, the potential impact and a suggested fix if you have one. We aim to acknowledge reports within 48 hours and to keep you updated until the issue is resolved.

---

## What the site does

legesher.io is a static Astro site. The one server-side route is the newsletter form's endpoint at `/api/subscribe`, which forwards a subscription to Buttondown. This section describes what that endpoint actually does; it is kept in step with `src/pages/api/subscribe.ts` and `src/lib/subscribe.ts`.

### Newsletter form (`/api/subscribe`)

What the endpoint does:

- **Server-side validation.** The body must be JSON; anything else is rejected with 400 and is not logged. `email` and `firstName` must be present strings, and that check runs first, so an empty JSON object answers "Email is required". Then the honeypot check below. Then the email must match a format pattern and be at most 254 characters, and the first name must be 1 to 150 characters made of letters, combining marks, spaces, hyphens and apostrophes in any script, plus the zero-width joiner and non-joiner some scripts need inside a word; markup, digits, line breaks and every other format character, bidirectional controls included, are rejected. Both values are trimmed and the email is lowercased; otherwise nothing is rewritten, and input that fails validation is rejected with 400.
- **Honeypot.** The form carries a hidden `website` field. A request with that field filled is rejected with 400.
- **IP forwarding.** The client address from `x-forwarded-for`, or `x-real-ip` when that is absent, is passed to Buttondown as `ip_address` for its spam prevention. The site does not store it.
- **Double opt-in.** Subscribers are created through Buttondown's API, which sends a confirmation email by default. The site never sends a subscriber type that would skip the confirmation.
- **Neutral responses.** A new address and an address Buttondown reports as already known (subscribed, unsubscribed, blocked, or flagged by its spam filter) receive the same reply, so the form does not reveal whether an address is on the list. Any other upstream error answers a generic 500.
- **Secret handling.** `BUTTONDOWN_API_KEY` is declared as a server secret in `astro.config.mjs` and read at request time; it is not compiled into the deployed bundle. When it is absent the endpoint answers 500 and logs the reason.
- **Logging.** On an upstream error the HTTP status and Buttondown's error code are logged. Request bodies, addresses and names are not.

What the endpoint does not do:

- **No rate limiting.** The endpoint has none. Buttondown applies its own firewall and request limits to the API. A limiter will be added if abuse appears.
- **No HTML sanitisation.** Inputs are validated and rejected, not cleaned.

### Privacy

- Data collected: email, first name, and campaign attribution (`utm_source`, `utm_campaign`) taken from the subscribing page's URL when present. All of it is disclosed in the Privacy Policy.
- Unsubscribing is handled by Buttondown.

---

## Dependency security

We regularly monitor dependencies for security vulnerabilities using `npm audit`. Known issues are tracked internally and addressed as patches become available.

To check the current status:
```bash
npm audit
```
