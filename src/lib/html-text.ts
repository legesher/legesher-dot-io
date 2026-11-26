// Text helpers for the tests that read HTML: the layout's source
// (layout-head.test.ts) and the built pages (built-head.test.ts,
// analytics-csp.test.ts). The input is always this site's own source or build
// output, never a visitor's text, so these are not sanitizers. Each one
// repeats its replacement until nothing changes, so removing one match can
// never join the text on either side of it into a new match (the fix code
// scanning asks for). For tags that changes nothing. For comments it departs
// from the browser only when a partial opener ("<", "<!" or "<!-") comes right
// before a comment: the browser keeps it as text or a bogus comment, while the
// repeat joins it to the text after the comment. This site's source and build
// output do not contain one.

/**
 * Removes HTML comments, so a note that mentions a tag is not read as a tag.
 * A comment ends at the first "-->" or "--!>", and "<!-->" and "<!--->" are
 * complete, empty comments, as the HTML parser reads them.
 */
export function stripHtmlComments(html: string): string {
  let previous: string;
  do {
    previous = html;
    html = html.replace(/<!--(?:-?>|[\s\S]*?--!?>)/g, '');
  } while (html !== previous);
  return html;
}

/** Removes every tag and keeps the text between them. */
export function stripTags(html: string): string {
  let previous: string;
  do {
    previous = html;
    html = html.replace(/<[^>]*>/g, '');
  } while (html !== previous);
  return html;
}
