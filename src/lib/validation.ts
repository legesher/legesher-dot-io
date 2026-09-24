// Input validation for the subscribe endpoint (src/pages/api/subscribe.ts),
// kept in a plain module so the patterns can be unit-tested.

// Email validation regex
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Name validation regex (supports international characters)
export const NAME_REGEX = /^[\p{L}\s\-']{2,150}$/u;
