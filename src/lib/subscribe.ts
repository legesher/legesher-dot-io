// The subscribe endpoint's logic, kept out of src/pages/api/subscribe.ts so it
// can be unit-tested with a fake fetch. The route parses the request body,
// reads the secret, and hands everything else to the functions here.

import { normalizeAttribution } from './attribution';
import { EMAIL_MAX_LENGTH, EMAIL_REGEX, NAME_REGEX } from './validation';

export { EMAIL_MAX_LENGTH };

// The documented host. api.buttondown.email still answers, but the API
// reference and its OpenAPI schema name api.buttondown.com.
export const BUTTONDOWN_SUBSCRIBERS_URL = 'https://api.buttondown.com/v1/subscribers';

export type ValidRequest = {
  ok: true;
  email: string;
  firstName: string;
  utmSource: unknown;
  utmCampaign: unknown;
};

export type InvalidRequest = { ok: false; status: 400; message: string };

function invalid(message: string): InvalidRequest {
  return { ok: false, status: 400, message };
}

// Validates and rejects; nothing is stripped or rewritten. The order is part
// of the contract: an empty body reads "Email is required" before anything
// else, which is what the production key-presence probe relies on.
export function validateSubscribeRequest(data: unknown): ValidRequest | InvalidRequest {
  const body = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
  const { email, firstName, website, utmSource, utmCampaign } = body;

  if (!email || typeof email !== 'string') return invalid('Email is required');
  if (!firstName || typeof firstName !== 'string') return invalid('First name is required');
  // Honeypot: the field is hidden from people, so a value means a bot.
  if (website) return invalid('Invalid submission');

  const trimmedEmail = email.trim();
  if (trimmedEmail.length > EMAIL_MAX_LENGTH || !EMAIL_REGEX.test(trimmedEmail)) {
    return invalid('Invalid email format');
  }
  const trimmedName = firstName.trim();
  if (!NAME_REGEX.test(trimmedName)) return invalid('Invalid first name format');

  return {
    ok: true,
    email: trimmedEmail.toLowerCase(),
    firstName: trimmedName,
    utmSource,
    utmCampaign,
  };
}

export type SubscriberPayload = {
  email_address: string;
  ip_address?: string;
  tags: string[];
  metadata: Record<string, string>;
};

export function buildSubscriberPayload(input: {
  email: string;
  firstName: string;
  ip: string | undefined;
  utmSource: unknown;
  utmCampaign: unknown;
  subscribedAt: string;
}): SubscriberPayload {
  // utm_source names the channel a subscriber arrived through; utm_campaign
  // names the release that brought them.
  //
  // These are LAST touch, not first: they describe the visit that ended in a
  // subscription. Someone who arrives via LinkedIn, leaves, and returns direct
  // a week later records as direct. Recording true first touch would mean
  // persisting the original UTM across sessions, which requires client-side
  // storage the privacy policy commits to never using.
  const lastTouchChannel = normalizeAttribution(input.utmSource);
  const lastTouchRelease = normalizeAttribution(input.utmCampaign);

  // No `type`: Buttondown applies double opt-in to API-created subscribers by
  // default and `type: 'regular'` would skip the confirmation email. Whether
  // the confirmation is sent is the account's setting, not this payload's.
  return {
    email_address: input.email,
    // Forwarded for Buttondown's spam prevention; omitted when unknown.
    ...(input.ip && { ip_address: input.ip }),
    tags: ['website-subscriber'],
    metadata: {
      first_name: input.firstName,
      source: 'website',
      // Omitted entirely when the visit carried no UTM, so an absent field
      // means "not measured" rather than "arrived directly".
      //
      // These two values are attacker-controlled: anyone can craft a link
      // to this site carrying any UTM they like. Normalization blocks
      // markup, quotes, newlines and spreadsheet formulas, but it cannot
      // stop readable prose: "ignore-previous-instructions-and-..."
      // survives as a valid slug. Treat them as untrusted DATA wherever
      // they are later read, especially by anything that puts subscriber
      // metadata into a language-model prompt.
      ...(lastTouchChannel && { last_touch_channel: lastTouchChannel }),
      ...(lastTouchRelease && { last_touch_release: lastTouchRelease }),
      subscribed_at: input.subscribedAt,
    },
  };
}

export type SubscribeOutcome =
  | { kind: 'created' }
  // Buttondown refused this address: already subscribed, unsubscribed, or
  // blocked. The caller must not be able to tell these apart from `created`.
  | { kind: 'declined'; status: 400; code: string | undefined }
  // Our side or Buttondown's is misconfigured or down.
  | { kind: 'failed'; status: number; code: string | undefined };

export async function createButtondownSubscriber(
  apiKey: string,
  payload: SubscriberPayload,
  fetchImpl: typeof fetch = fetch,
): Promise<SubscribeOutcome> {
  const response = await fetchImpl(BUTTONDOWN_SUBSCRIBERS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  // Status first, body second. An error body is not always JSON (a proxy's
  // HTML 502, an empty 429), so it is read as text and parsed only if it
  // parses.
  const body = await response.text();
  if (response.status >= 200 && response.status < 300) return { kind: 'created' };
  const code = errorCode(body);
  if (response.status === 400) return { kind: 'declined', status: 400, code };
  return { kind: 'failed', status: response.status, code };
}

// Buttondown's error body is {"code": "...", "detail": "...", "metadata": {}}.
// Only the machine-readable code is kept, and only when it is a string.
function errorCode(body: string): string | undefined {
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed === 'object' && parsed !== null) {
      const { code } = parsed as { code?: unknown };
      if (typeof code === 'string') return code;
    }
  } catch {
    // Not JSON; the status alone is logged.
  }
  return undefined;
}

export function json(status: number, message: string): Response {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function responseFor(outcome: SubscribeOutcome): Response {
  if (outcome.kind === 'failed') return json(500, 'Unable to process subscription at this time');
  // A created subscriber and one Buttondown declined get the same reply, so
  // the form cannot be used to test whether an address is on the list.
  return json(201, 'Check your email to confirm your subscription!');
}
