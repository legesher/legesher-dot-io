# Security

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for this repository: the Security tab, then "Report a vulnerability". It keeps the report private until a fix is published. Please include a description, steps to reproduce, the potential impact and a suggested fix if you have one. We aim to acknowledge reports within 48 hours and to keep you updated until the issue is resolved.

## Scope

legesher.io is a static site with one server-side route: the newsletter form's endpoint, which forwards subscriptions to Buttondown. Reports about the site, that endpoint, or this repository's build and dependencies are in scope. Issues in Buttondown's or Vercel's own platforms should go to those companies.

## Newsletter form

- The fields people fill in are validated on the server; a value that fails is rejected rather than cleaned up and passed on.
- There is a check for automated submissions.
- Subscriptions use double opt-in: no one is subscribed until the address is confirmed by email.
- Credentials are held as server-side secrets and are not part of the deployed bundle.
- What people enter is not written to logs.
- Traffic controls at the hosting layer are managed outside this repository and are not described here.

What the form collects, and why, is set out in the [Privacy Policy](https://www.legesher.io/privacy). Unsubscribing is handled by Buttondown.

## Dependency security

Dependencies are monitored for known vulnerabilities with `npm audit` and Dependabot. Findings are tracked internally and addressed as patches become available.
