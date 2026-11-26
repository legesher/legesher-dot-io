import { describe, expect, it } from 'vitest';

import { stripHtmlComments, stripTags } from './html-text';

describe('stripHtmlComments', () => {
  it.each([
    ['a comment closed by -->', 'a<!-- <script> -->b', 'ab'],
    ['a comment closed by --!>', 'a<!-- note --!><meta>b', 'a<meta>b'],
    ['the empty comment <!-->', 'a<!--><meta>b', 'a<meta>b'],
    ['the empty comment <!--->', 'a<!---><meta>b', 'a<meta>b'],
    ['a comment in Devanagari', 'नमस्ते<!-- टिप्पणी -->दुनिया', 'नमस्तेदुनिया'],
  ])('removes %s', (_name, input, expected) => expect(stripHtmlComments(input)).toBe(expected));

  it('ends a comment at its first close, keeping the markup after it', () =>
    expect(stripHtmlComments('<!-- one --!><link><!-- two -->')).toBe('<link>'));

  // The repeat is for code scanning: the browser would read "<!<!---->" as a bogus
  // comment and keep "-- x -->y". This site's own output has no "<!" before a comment.
  it('repeats until no comment opener is left, even when a removal joins the text around it', () =>
    expect(stripHtmlComments('<!<!---->-- x -->y')).toBe('y'));

  it('keeps text that holds no comment', () =>
    expect(stripHtmlComments('<p>שָׁלוֹם</p>')).toBe('<p>שָׁלוֹם</p>'));
});

describe('stripTags', () => {
  it('keeps the text between tags, in pointed Hebrew and Devanagari', () =>
    expect(stripTags('<p>नमस्ते</p><a href="/x">שָׁלוֹם</a>')).toBe('नमस्तेשָׁלוֹם'));

  it('leaves no tag behind', () => expect(stripTags('<<meta>script>x')).not.toMatch(/<[^>]*>/));

  it('returns an empty string for markup with no text', () =>
    expect(stripTags('<head><meta charset="utf-8"><title></title>').trim()).toBe(''));
});
