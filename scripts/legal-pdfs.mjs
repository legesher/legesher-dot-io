// Makes the downloadable PDF of each legal document from its built page, and
// records what each was made from and the PDF's own hash. Run
// `npm run legal:pdf` whenever a document in src/content/legal, its
// LAST_UPDATED date or src/layouts/LegalLayout.astro changes;
// src/lib/legal-pdf.test.ts fails until you do. It builds the site first, so
// a PDF is never printed from an old build, and leaves a PDF alone when
// nothing it is made from changed (`--all` remakes every one). Needs a
// Playwright Chromium: `npx playwright install chromium`.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

import { formatLastUpdated, LAST_UPDATED } from '../src/lib/page-dates.mjs';
import { pdfHref, pdfSourceHash } from '../src/lib/legal-pdf.mjs';

const root = join(import.meta.dirname, '..');
const output = join(root, '.vercel', 'output', 'static');
const legal = join(root, 'src', 'content', 'legal');
const manifestPath = join(legal, 'pdfs.json');
const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf-8')) : {};
const all = process.argv.includes('--all');
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

execFileSync('npx', ['astro', 'build'], { cwd: root, stdio: 'inherit' });

const slugs = readdirSync(legal)
  .filter((name) => name.endsWith('.mdx'))
  .map((name) => name.replace(/\.mdx$/, ''))
  .sort();

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
function resolve(url) {
  const path = normalize(decodeURIComponent(new URL(url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  for (const candidate of [join(output, path), join(output, path, 'index.html'), join(output, `${path}.html`)]) {
    if (candidate.startsWith(output) && existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}
const server = createServer((req, res) => {
  const file = resolve(req.url ?? '/');
  if (!file) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${server.address().port}`;

const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const browser = await chromium.launch();
const manifest = {};
try {
  for (const slug of slugs) {
    const source = pdfSourceHash(root, slug);
    const path = join(root, 'public', pdfHref(slug));
    if (!all && previous[slug]?.source === source && existsSync(path) && previous[slug].pdf === sha256(path)) {
      manifest[slug] = previous[slug];
      console.log(`public${pdfHref(slug)} (unchanged)`);
      continue;
    }
    const title = JSON.parse(/^title: (.*)$/m.exec(readFileSync(join(legal, `${slug}.mdx`), 'utf-8'))[1]);
    const page = await browser.newPage();
    await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.75in', bottom: '0.75in', left: '0.75in', right: '0.75in' },
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `<div style="font-family:Helvetica,Arial,sans-serif;font-size:8px;color:#6b7280;width:100%;padding:0 0.75in;display:flex;justify-content:space-between"><span>${escape(title)} · Effective ${escape(formatLastUpdated(LAST_UPDATED[slug]))}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    });
    await page.close();
    manifest[slug] = { source, pdf: sha256(path) };
    console.log(`public${pdfHref(slug)}`);
  }
} finally {
  await browser.close();
  server.close();
}
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
