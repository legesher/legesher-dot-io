import type { APIRoute } from 'astro';

// Enable server-side rendering for this endpoint
export const prerender = false;

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Name validation regex (supports international characters)
const NAME_REGEX = /^[\p{L}\s\-']{2,150}$/u;

// Attribution values come from UTM parameters on the landing URL, so they are
// client-supplied and untrusted. They are normalized to a slug rather than
// validated-and-discarded: a campaign named "Bridge Beta Launch" demonstrably
// acquired the subscriber, and rejecting it for containing spaces would lose
// attribution the campaign earned.
//
// Returns undefined when nothing usable was supplied, so the caller can omit
// the key entirely. Writing a placeholder instead would make "we never measured
// this" indistinguishable from "we measured it as direct".
// Letters and numbers of ANY script survive, matching NAME_REGEX above. An
// ASCII-only slug would erase a campaign named 日本語 to nothing and collapse
// "2026 日本 Launch" and "2026 Launch" to the same value — silently losing
// attribution for exactly the non-English announcements this project exists
// to serve.
function normalizeAttribution(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value
    .trim()
    .toLowerCase()
    // Compose after lowercasing, which can decompose (İ becomes i + U+0307),
    // so equivalent spellings settle on one form before being stored.
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-');
  // Slice by code point rather than UTF-16 unit: a plain .slice() can cut a
  // surrogate pair in half and leave an unpaired surrogate.
  const truncated = Array.from(normalized).slice(0, 64).join('');
  return truncated.replace(/^[-._]+|[-._]+$/gu, '') || undefined;
}

export const POST: APIRoute = async ({ request }) => {
  const BUTTONDOWN_API_KEY = import.meta.env.BUTTONDOWN_API_KEY;

  if (!BUTTONDOWN_API_KEY) {
    return new Response(
      JSON.stringify({ message: 'Service temporarily unavailable' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get client IP to forward to Buttondown (used by their spam prevention)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';

    // Parse request data
    const data = await request.json();

    // CRITICAL: Validate all input types
    if (!data.email || typeof data.email !== 'string') {
      return new Response(
        JSON.stringify({ message: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data.firstName || typeof data.firstName !== 'string') {
      return new Response(
        JSON.stringify({ message: 'First name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check honeypot field
    if (data.website) {
      // Bot filled the honeypot - silently reject
      return new Response(
        JSON.stringify({ message: 'Invalid submission' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Format validation for email and firstName
    if (!EMAIL_REGEX.test(data.email.trim())) {
      return new Response(
        JSON.stringify({ message: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!NAME_REGEX.test(data.firstName.trim())) {
      return new Response(
        JSON.stringify({ message: 'Invalid first name format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // utm_source names the channel a subscriber arrived through; utm_campaign
    // names the release that brought them.
    //
    // These are LAST touch, not first: they describe the visit that ended in a
    // subscription. Someone who arrives via LinkedIn, leaves, and returns direct
    // a week later records as direct. Recording true first touch would mean
    // persisting the original UTM across sessions, which requires client-side
    // storage the privacy policy commits to never using.
    const lastTouchChannel = normalizeAttribution(data.utmSource);
    const lastTouchRelease = normalizeAttribution(data.utmCampaign);

    // Subscribe to newsletter
    const response = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${BUTTONDOWN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: data.email.trim().toLowerCase(),
        ip_address: ip !== 'unknown' ? ip : undefined,
        tags: ['website-subscriber'],
        metadata: {
          first_name: data.firstName.trim(),
          source: 'website',
          // Omitted entirely when the visit carried no UTM, so an absent field
          // means "not measured" rather than "arrived directly".
          ...(lastTouchChannel && { last_touch_channel: lastTouchChannel }),
          ...(lastTouchRelease && { last_touch_release: lastTouchRelease }),
          subscribed_at: new Date().toISOString()
        }
      }),
    });

    const responseData = await response.json();

    if (response.status >= 400) {
      // Log error for debugging (without exposing user data)
      console.error('Buttondown API error:', {
        status: response.status
      });

      return new Response(
        JSON.stringify({ message: 'Unable to process subscription at this time' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Check your email to confirm your subscription!' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Subscription error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ message: 'Unable to process subscription at this time' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 