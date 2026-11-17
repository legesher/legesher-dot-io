// Turns a line of copy into safe HTML with the followed language's name in it.

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

export const escapeHtml = (text: string): string => text.replace(/[&<>"]/g, (c) => ESCAPES[c]);

/**
 * Replaces every `{lang}` in `text` with the language's name in its own
 * script. The name sits in a <bdi>, so a right-to-left name does not reorder
 * the sentence around it, and carries `data-l="native"` so the page script can
 * swap it when the visitor follows another language.
 */
export const fillLanguage = (text: string, language: { native: string; tag: string }): string =>
  escapeHtml(text).replace(
    /\{lang\}/g,
    `<bdi data-l="native" lang="${escapeHtml(language.tag)}" class="font-semibold">${escapeHtml(language.native)}</bdi>`,
  );
