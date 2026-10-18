// Input validation for the subscribe endpoint (src/pages/api/subscribe.ts),
// kept in a plain module so the patterns can be unit-tested.

// Email validation regex
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// The longest address SMTP will deliver (RFC 5321 path limit). Buttondown's
// own bound on email_address is the same number.
export const EMAIL_MAX_LENGTH = 254;

// Name validation. Letters (\p{L}) and combining marks (\p{M}) of any script:
// every vowel sign, virama, niqqud and haraka is a mark, so a class of letters
// alone rejects most Indic, Sinhala, Thai, pointed Hebrew and vocalised Arabic
// names while Latin, Han and Hangul pass unnoticed (CORE-2180). Space
// separators (\p{Zs}), hyphens and apostrophes join name parts. The zero-width
// joiner and non-joiner (U+200D, U+200C) are the two format characters some
// scripts need inside a word (Sinhala conjuncts, Persian and Urdu spelling);
// every other format character stays out, which keeps bidi controls, the byte
// order mark, soft hyphens and zero-width spaces out. \s is deliberately not
// used: it includes U+FEFF and line breaks. The lookahead requires at least
// one letter, so a name cannot be made of spaces, punctuation or joiners
// alone. One character is a valid given name.
export const NAME_REGEX = /^(?=[\s\S]*\p{L})[\p{L}\p{M}\p{Zs}\-'‌‍]{1,150}$/u;
