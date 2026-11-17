import { describe, expect, it } from 'vitest';
import { escapeHtml, fillLanguage } from './fill';

// fillLanguage puts a language's name, in its own script, into a line of copy
// that is then rendered as HTML. Latin names prove nothing about that, so the
// names below carry combining marks, a joiner, right-to-left text and CJK.

const names = [
  { label: 'vocalised Arabic', native: 'العَرَبِيَّة', tag: 'ar' },
  { label: 'pointed Hebrew', native: 'עִבְרִית', tag: 'he' },
  { label: 'Devanagari', native: 'हिन्दी', tag: 'hi' },
  { label: 'Sinhala with a zero-width joiner', native: 'ශ්‍රී ලංකා', tag: 'si' },
  { label: 'Thai', native: 'ภาษาไทย', tag: 'th' },
  { label: 'CJK', native: '中文', tag: 'zh-Hans' },
  // Shin, dagesh, shin dot, qamats: marks in the order people type them, which
  // is not canonical order, so any normalization would reorder them.
  { label: 'pointed Hebrew with marks in typed order', native: 'שָּׁלוֹם', tag: 'he' },
];

describe('fillLanguage keeps a name exactly as written', () => {
  it('has a case that normalization would change, so the check below can fail', () => {
    expect(names.some(({ native }) => native.normalize('NFC') !== native)).toBe(true);
  });

  it.each(names)('$label', ({ native, tag }) => {
    const html = fillLanguage('Review {lang}.', { native, tag });
    const name = html.match(/<bdi[^>]*>(.*?)<\/bdi>/)?.[1];
    expect(name).toBe(native);
    expect([...name!].length).toBe([...native].length);
  });
});

describe('fillLanguage', () => {
  const arabic = { native: 'العَرَبِيَّة', tag: 'ar' };

  it('replaces every placeholder', () => {
    const html = fillLanguage('{lang} and {lang}', arabic);
    expect(html.match(/<bdi /g)).toHaveLength(2);
    expect(html).not.toContain('{lang}');
  });

  it('isolates the name and marks its language, so a right-to-left name does not reorder the sentence', () => {
    expect(fillLanguage('Write Python in {lang}.', arabic)).toBe(
      'Write Python in <bdi data-l="native" lang="ar" class="font-semibold">العَرَبِيَّة</bdi>.',
    );
  });

  it('escapes the copy, the name and the tag', () => {
    const html = fillLanguage('<b>{lang}</b> & "x"', { native: '<i>', tag: '"x' });
    expect(html).toBe(
      '&lt;b&gt;<bdi data-l="native" lang="&quot;x" class="font-semibold">&lt;i&gt;</bdi>&lt;/b&gt; &amp; &quot;x&quot;',
    );
  });

  it('leaves copy without a placeholder as escaped text', () => {
    expect(fillLanguage('No name here.', arabic)).toBe('No name here.');
  });
});

describe('escapeHtml', () => {
  it('escapes the four characters that matter in text and attributes', () => {
    expect(escapeHtml(`<a href="x">&</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });
});
