// Which registry language a requested language names: from the page's ?lang=
// parameter, or from one of the browser's preferred languages.
//
// The page tells the visitor the language is the one their browser asks for,
// so a match must not cross scripts. A request matches a language when it is
// the language's code, or when it shares the main subtag of the code or the
// tag and both name the same script or neither names one: pt-BR is Portuguese
// and nb is Norwegian (code no), but zh-TW is not the Simplified Chinese pack
// (zh-Hans), and sr-Latn is not the Cyrillic one.

interface Tagged {
  readonly code: string;
  readonly tag: string;
}

const scriptOf = (subtags: string[]) => subtags.slice(1).find((s) => /^[a-z]{4}$/.test(s));

/** The registry code the request names, or undefined. Case does not matter. */
export function languageFor(requested: string, languages: readonly Tagged[]): string | undefined {
  const wanted = requested.trim().toLowerCase();
  if (!wanted) return undefined;

  const exact = languages.find((l) => l.code.toLowerCase() === wanted);
  if (exact) return exact.code;

  const subtags = wanted.split('-');
  const script = scriptOf(subtags);
  const match = languages.find((l) => {
    const tag = l.tag.toLowerCase().split('-');
    if (tag[0] !== subtags[0] && l.code.toLowerCase() !== subtags[0]) return false;
    return scriptOf(tag) === script;
  });
  return match?.code;
}
