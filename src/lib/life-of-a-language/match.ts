// Which registry language a requested language names: from the page's ?lang=
// parameter, or from one of the browser's preferred languages.
//
// The page tells the visitor the language is the one their browser asks for,
// so a match must not cross scripts. A request matches a language when it is
// the language's code, or when it names the same language (by the code or the
// tag) in the same likely script. The likely script comes from the platform's
// own data (Intl.Locale's maximize): zh-CN is written in Hans, so it matches
// the zh-Hans pack, while zh-TW is written in Hant and does not; sr-RS matches
// the Cyrillic Serbian pack and sr-ME does not.

interface Tagged {
  readonly code: string;
  readonly tag: string;
}

function parse(tag: string): { language: string; script?: string } | undefined {
  try {
    const locale = new Intl.Locale(tag);
    return { language: locale.language.toLowerCase(), script: locale.maximize().script?.toLowerCase() };
  } catch {
    return undefined;
  }
}

/** The registry code the request names, or undefined. Case does not matter. */
export function languageFor(requested: string, languages: readonly Tagged[]): string | undefined {
  const wanted = requested.trim().toLowerCase();
  if (!wanted) return undefined;

  const exact = languages.find((l) => l.code.toLowerCase() === wanted);
  if (exact) return exact.code;

  const request = parse(wanted);
  if (!request) return undefined;
  const asked = new Set([request.language, wanted.split('-')[0]]);

  const match = languages.find((l) => {
    const pack = parse(l.tag);
    if (!pack) return false;
    const names = [pack.language, l.code.toLowerCase(), l.tag.toLowerCase().split('-')[0]];
    return names.some((n) => asked.has(n)) && pack.script === request.script;
  });
  return match?.code;
}
