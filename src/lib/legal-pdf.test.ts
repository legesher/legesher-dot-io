// Each legal document has a PDF at public/legal/<slug>.pdf, made by
// `npm run legal:pdf` (scripts/legal-pdfs.mjs) from the built page. The PDF
// must be remade whenever the document, its date or the layout changes, or
// the download would carry old text. Parametrized from the real content
// directory, never a frozen list.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { pdfHref, pdfSourceHash } from './legal-pdf.mjs';

const root = join(import.meta.dirname, '..', '..');
const slugs = readdirSync(join(root, 'src', 'content', 'legal'))
  .filter((name) => name.endsWith('.mdx'))
  .map((name) => name.replace(/\.mdx$/, ''));
const manifestPath = join(root, 'src', 'content', 'legal', 'pdfs.json');
const manifest: Record<string, string> = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf-8'))
  : {};

describe('legal PDFs', () => {
  it.each(slugs)('%s: the PDF exists and is a PDF', (slug) => {
    const path = join(root, 'public', pdfHref(slug));
    expect(existsSync(path), `${path} is missing; run npm run legal:pdf`).toBe(true);
    expect(readFileSync(path).subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it.each(slugs)('%s: the PDF was made from the current document, date and layout', (slug) => {
    expect(
      manifest[slug],
      `public${pdfHref(slug)} is out of date (src/content/legal/${slug}.mdx, its LAST_UPDATED date or LegalLayout.astro changed); run npm run legal:pdf`,
    ).toBe(pdfSourceHash(root, slug));
  });

  it('records no PDF for a document that does not exist', () => {
    expect(Object.keys(manifest).filter((slug) => !slugs.includes(slug))).toEqual([]);
  });
});
