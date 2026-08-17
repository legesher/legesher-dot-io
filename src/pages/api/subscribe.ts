import type { APIRoute } from 'astro';

// Enable server-side rendering for this endpoint
export const prerender = false;

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Name validation regex (supports international characters)
const NAME_REGEX = /^[\p{L}\s\-']{2,150}$/u;

// Attribution values come from UTM parameters on the landing URL, so they are
// client-supplied and untrusted. Constrain them to a slug shape before they
// reach Buttondown's metadata.
const ATTRIBUTION_REGEX = /^[a-z0-9][a-z0-9._-]{0,63}$/;

// A malformed attribution value falls back to the default rather than failing
// the request: a bad UTM is not a reason to lose a subscriber.
function sanitizeAttribution(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  return ATTRIBUTION_REGEX.test(normalized) ? normalized : fallback;
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
    // names the release that brought them. An unattributed signup records as
    // 'unattributed' rather than inheriting the current release — stamping a
    // release onto a signup it did not earn would inflate that release's credit.
    const firstTouchChannel = sanitizeAttribution(data.utmSource, 'website');
    const firstTouchRelease = sanitizeAttribution(data.utmCampaign, 'unattributed');

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
          first_touch_channel: firstTouchChannel,
          first_touch_release: firstTouchRelease,
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