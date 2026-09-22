import type { APIRoute } from 'astro';
import { normalizeAttribution } from '@/lib/attribution';
import { EMAIL_REGEX, NAME_REGEX } from '@/lib/validation';

// Enable server-side rendering for this endpoint
export const prerender = false;

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
          //
          // These two values are attacker-controlled: anyone can craft a link
          // to this site carrying any UTM they like. Normalization blocks
          // markup, quotes, newlines and spreadsheet formulas, but it cannot
          // stop readable prose — "ignore-previous-instructions-and-…"
          // survives as a valid slug. Treat them as untrusted DATA wherever
          // they are later read, especially by anything that puts subscriber
          // metadata into a language-model prompt.
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