import type { APIRoute } from 'astro';
import { getSecret } from 'astro:env/server';
import {
  buildSubscriberPayload,
  createButtondownSubscriber,
  json,
  responseFor,
  validateSubscribeRequest,
} from '@/lib/subscribe';

// The one route that needs the server; every other page is prerendered.
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  // Read at request time. BUTTONDOWN_API_KEY is declared as a server secret
  // in astro.config.mjs; import.meta.env would have inlined it at build time,
  // or inlined undefined when the build ran without it (CORE-2193).
  const apiKey = getSecret('BUTTONDOWN_API_KEY');
  if (!apiKey) {
    console.error(
      'BUTTONDOWN_API_KEY is not set in this environment; /api/subscribe cannot create subscribers',
    );
    return json(500, 'Service temporarily unavailable');
  }

  try {
    const data: unknown = await request.json();
    const validated = validateSubscribeRequest(data);
    if (validated.ok === false) return json(validated.status, validated.message);

    // Client IP, forwarded to Buttondown for its spam prevention.
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded
      ? forwarded.split(',')[0].trim()
      : request.headers.get('x-real-ip') || undefined;

    const outcome = await createButtondownSubscriber(
      apiKey,
      buildSubscriberPayload({
        email: validated.email,
        firstName: validated.firstName,
        ip,
        utmSource: validated.utmSource,
        utmCampaign: validated.utmCampaign,
        subscribedAt: new Date().toISOString(),
      }),
    );

    // Status and Buttondown's error code only; never the address or the name.
    if (outcome.kind === 'declined') {
      console.warn('Buttondown declined the subscriber:', { status: outcome.status, code: outcome.code });
    } else if (outcome.kind === 'failed') {
      console.error('Buttondown API error:', { status: outcome.status, code: outcome.code });
    }
    return responseFor(outcome);
  } catch (error) {
    console.error('Subscription error:', error instanceof Error ? error.message : 'Unknown error');
    return json(500, 'Unable to process subscription at this time');
  }
};
