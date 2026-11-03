# legesher-dot-io

The public website at legesher.io: an Astro 6 static site with React islands,
Tailwind 3, one server route (`/api/subscribe`) and the Vercel adapter. It is
not the docs site and not the product; it holds no engine code and no pack
data. Page and layout changes are visual work and are reviewed as such.

## Layout

- `src/pages/`: `index.astro`, `privacy.astro`, `refunds.astro`, `terms.astro`, and
  `api/subscribe.ts`, the one route with `export const prerender = false`.
- `src/layouts/Layout.astro`: the single page shell; it imports `src/styles/globals.css`.
- `src/components/`: page sections (`Header`, `Hero`, `Features`, `CodeEditor`, `Newsletter`,
  `Footer`, `ButtonLink`) and `ui/`, the shadcn-style React primitives.
- `src/lib/`: `links.ts` (single source of outbound links), `subscribe.ts` (the subscribe
  endpoint's validation, payload and Buttondown call, so the route stays thin), `attribution.ts`,
  `validation.ts`, `page-dates.mjs` (sitemap `lastmod`), `utils.ts`, and the co-located `*.test.ts`
  suites.
- `src/styles/globals.css`: Tailwind directives, the Noto font imports and the theme tokens.
- `public/`: static images, `robots.txt`, and `scripts/` (plain JS the components load, including
  `analytics.js`, the PostHog loader the layout renders only when the build carries
  `PUBLIC_POSTHOG_KEY`).
- `.astro/`: Astro-generated type files; tracked, see Gotchas.
- `astro.config.mjs`: CSP directives (widened to PostHog's origin only when `PUBLIC_POSTHOG_KEY` is
  set), `env.schema`, sitemap, Vercel adapter, `output: 'static'`, `trailingSlash: 'never'`,
  `build.format: 'file'`.
- `tailwind.config.ts`, `postcss.config.js`, `components.json`, `vitest.config.ts`.
- `vercel.json`: the `/go/*` redirects and the apex to `www` redirect.
- `.github/`: `workflows/` (`ci.yml`, `security-audit.yml`, bot workflows), `dependabot.yml`,
  `PULL_REQUEST_TEMPLATE.md`, `SECURITY.md`, `CONTRIBUTING.md`, issue templates.

## Validate locally

```sh
nvm use                    # .nvmrc pins Node 22
npm ci --ignore-scripts    # exactly what the lockfile pins, no lifecycle scripts
npm test                   # vitest
npm run check              # astro check
npm run build              # astro build
```

Summary lines to expect (counts as of 2026-10-27; they grow, they never shrink):

- `npm test`: ` Test Files  11 passed (11)` then `      Tests  225 passed (225)` after `npm run build`; without build output the two built-page guards skip by name and the lines read
  ` Test Files  9 passed | 2 skipped (11)` then `      Tests  215 passed | 2 skipped (217)`
- `npm run check`: `- 0 errors` and `- 0 warnings` (hints are reported and do not fail the run). The
  error line is singular when there is one (`- 1 error`), so grep for `error`, not `errors`.
- `npm run build`: `[build] Complete!` after the Vercel adapter copies static files

`.github/workflows/ci.yml` runs the same steps in the order install, build, test, check, under the
`.nvmrc` Node with `cache: "npm"`.

Facts behind those commands:

- `vitest.config.ts` collects only `src/**/*.test.ts`; tests sit beside the module they cover, and
  Astro ignores them because nothing under `src/pages` imports a test file.
- `tailwind.config.ts` scans `src/**` and excludes `!./src/**/*.test.ts`, so words in test prose
  never become utility classes in the shipped stylesheet. A change to the scan must keep the
  client bundle byte-identical to a build of `main`.
- Fonts are Noto (Noto Sans, Noto Sans Display, Noto Sans Mono, Noto Sans Arabic) loaded from
  Google Fonts in `globals.css`. The CSP in `astro.config.mjs` allowlists `fonts.googleapis.com`
  and `fonts.gstatic.com`; a new font source needs a CSP edit as well. The policy is enforced:
  `style-src` carries Astro's hashes, and browsers ignore `'unsafe-inline'` once a hash is present, so
  an inline `style=""` attribute or an inline event handler is refused. The built HTML has none today.

## Merge evidence and PR conventions

- Branch `madi/core-####-slug` (or your own handle), one branch per unit of work.
- Squash merge. Subject `type(scope): summary [CORE-####] (#N)`; GitHub appends the `(#N)`.
- Quote the `npm test`, `npm run check` and `npm run build` summary lines in the PR body. CI may
  be queued; the local validate run is recorded in the PR body.
- A page or layout change needs a screenshot in the PR before merge.
- Vercel deploys from the repository independently of GitHub Actions: a merge ships whether or
  not the Actions run executed, so the local run is the gate.
- No em dashes in prose, commit messages or PR bodies.

## Testing contract

- Known failures are named `it.skip` / `it.fails` ledgers citing a ticket, never weakened
  assertions.
- Parametrize from the real data (`LINKS` in `src/lib/links.ts`, the redirect table in
  `vercel.json`), never a frozen list; `links.test.ts` checks the two against each other.
- Prove every new guard or validation test can fail in a throwaway copy before raising the PR,
  and record the probe (what was injected, which named failures fired) in the PR body.
- Latin identifiers prove nothing. Unicode assertions use combining-mark scripts: Devanagari,
  Sinhala with ZWJ, pointed Hebrew, vocalised Arabic, Thai, CJK.
- The repo-hygiene guard `src/lib/repo-hygiene.test.ts` runs in the default `npm test` and fails
  on a tracked folderOpen editor task, an automatic-tasks setting, non-font bytes under a font
  extension, or `.env` not ignored or tracked.
- The runtime-secret guard `src/lib/subscribe-secret.test.ts` bans the build-time environment
  accessor from every non-test source under `src/lib` and `src/pages/api`, comments included,
  because Astro's build inlines every private variable named in a module that contains it. Secrets
  are declared in `env.schema` in `astro.config.mjs` and read with `getSecret` from `astro:env/server`.
  The build-time proof is a sentinel build: `BUTTONDOWN_API_KEY=SENTINEL npm run build` then
  `grep -rl SENTINEL dist .vercel/output` must print nothing.
- Two guards keep the Content Security Policy inside `<head>`: `src/lib/layout-head.test.ts` reads
  `Layout.astro` and allows only `meta`, `link`, `title`, `script`, `style`, `base`, `noscript` and
  `template` there, with the two Vercel analytics components after the slot in `<body>`;
  `src/lib/built-head.test.ts` reads every built page under `.vercel/output/static` and asserts the
  CSP meta sits inside `<head>` with nothing the parser would move to `<body>` before it. A custom
  element in `<head>` makes the parser close `<head>` early, and browsers ignore a CSP meta in
  `<body>`. CI builds before it tests; locally run `npm run build` before `npm test` to exercise it.
- Two guards keep the PostHog loader honest: `src/lib/analytics-csp.test.ts` reads every built page
  and asserts the loader is present exactly when the policy carries PostHog's origin, sits in
  `<body>` after the content, and that a build without the key mentions PostHog nowhere;
  `src/lib/analytics-loader.test.ts` pins each promise the privacy page makes (zero storage, Do Not
  Track, no session reconstruction, no profiling) to the loader option that keeps it, and the event
  schema to its five names. Exercise the keyed branch locally with
  `PUBLIC_POSTHOG_KEY=phc_SENTINEL npm run build && npm test`; CI builds without a key.

## Gotchas

- `npm ci` must run under the `.nvmrc` Node (22). Since #203 `prettier` is declared in
  `package.json`, so the lockfile resolves under the npm 10 that Node 22 bundles.
- `.astro/` is both tracked and listed in `.gitignore`. A build can regenerate files there (today
  it adds an untracked `content.d.ts` and `env.d.ts`, and since `astro.config.mjs` declares an
  `env.schema` it also adds an `env.d.ts` reference line to the tracked `types.d.ts`, so that file
  shows as modified after every `npm run check` or build). Never commit a change under `.astro/`.
  `tsconfig.json` includes `.astro/types.d.ts` on purpose: without it `astro check` cannot type an
  `astro:env/client` import and reports `- 1 error`.
- `npm run build` writes `dist/` and `.vercel/output/`; both are ignored and neither is committed.
- The `/go/*` short links in `vercel.json` are static JSON and cannot import `src/lib/links.ts`.
  Update both when a link rotates; the parity test catches a miss.
- `output: 'static'` is the default for every page. A route that needs the server must opt out
  with `export const prerender = false`, and the sitemap then excludes it automatically.
- `astro check` prints hints (31 at the time of writing); only errors fail the command.
