// The downloadable PDF of each legal document lives at public/legal/<slug>.pdf
// and is made by scripts/legal-pdfs.mjs from the built page, so it is a file
// in the repository, not a build step. src/content/legal/pdfs.json records,
// per document, a hash of what the PDF was made from: the document, its date
// and the layout. src/lib/legal-pdf.test.ts fails when any of them changed
// after the PDF was made.
//
// Plain .mjs so the script and the test share it.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { LAST_UPDATED } from './page-dates.mjs';

/** The hash of what <slug>.pdf is made from. root is the repository root. */
export function pdfSourceHash(root, slug) {
  const hash = createHash('sha256');
  hash.update(readFileSync(join(root, 'src', 'content', 'legal', `${slug}.mdx`)));
  hash.update(`\n${LAST_UPDATED[slug]}\n`);
  hash.update(readFileSync(join(root, 'src', 'layouts', 'LegalLayout.astro')));
  return hash.digest('hex');
}

/** Where the PDF is served, and where the page's download button points. */
export function pdfHref(slug) {
  return `/legal/${slug}.pdf`;
}
