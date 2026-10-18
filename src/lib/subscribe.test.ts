import { describe, expect, it, vi } from 'vitest';
import {
  BUTTONDOWN_SUBSCRIBERS_URL,
  EMAIL_MAX_LENGTH,
  buildSubscriberPayload,
  createButtondownSubscriber,
  readJsonBody,
  responseFor,
  validateSubscribeRequest,
} from './subscribe';
import { NAME_REGEX } from './validation';

const valid = { email: 'Reader@Example.com', firstName: 'हिन्दी' };

describe('validateSubscribeRequest', () => {
  it.each([
    ['a body with no email', { firstName: 'Ana' }, 'Email is required'],
    ['a non-string email', { email: 42, firstName: 'Ana' }, 'Email is required'],
    ['a body that is not an object', 'reader@example.com', 'Email is required'],
    ['a null body', null, 'Email is required'],
    ['a body with no first name', { email: 'reader@example.com' }, 'First name is required'],
    ['a filled honeypot', { ...valid, website: 'https://spam.example' }, 'Invalid submission'],
    ['a malformed email', { ...valid, email: 'reader@localhost' }, 'Invalid email format'],
    [
      'an email over the length bound',
      { ...valid, email: `${'a'.repeat(EMAIL_MAX_LENGTH - 10)}@example.com` },
      'Invalid email format',
    ],
    ['markup in the first name', { ...valid, firstName: '<b>' }, 'Invalid first name format'],
    ['a whitespace-only first name', { ...valid, firstName: '   ' }, 'Invalid first name format'],
    [
      'a bidi override in the first name',
      { ...valid, firstName: 'Ana\u202eanA' },
      'Invalid first name format',
    ],
  ])('rejects %s', (_label, body, message) => {
    expect(validateSubscribeRequest(body)).toEqual({ ok: false, status: 400, message });
  });

  it('checks the email before the honeypot, so an empty body reads "Email is required"', () => {
    expect(validateSubscribeRequest({ website: 'x' })).toMatchObject({ message: 'Email is required' });
  });

  it('accepts an email of exactly the length bound', () => {
    const local = 'a'.repeat(EMAIL_MAX_LENGTH - '@example.com'.length);
    const result = validateSubscribeRequest({ ...valid, email: `${local}@example.com` });
    expect(result.ok).toBe(true);
  });

  it.each(['हिन्दी', 'ශ්\u200dරී', 'שָׁלוֹם', 'مُحَمَّد', 'สมศักดิ์', '李', 'a'])(
    'accepts the first name %s',
    (firstName) => {
      const result = validateSubscribeRequest({ ...valid, firstName });
      expect(result).toEqual({
        ok: true,
        email: 'reader@example.com',
        firstName,
        utmSource: undefined,
        utmCampaign: undefined,
      });
    },
  );

  it('rejects a name longer than 150 code points can be without running the regex', () => {
    // 150 code points are at most 300 UTF-16 units; this is 4,000,000 marks.
    const marks = String.fromCodePoint(0x0301).repeat(4_000_000);
    const regexRun = vi.spyOn(NAME_REGEX, 'test');
    try {
      expect(validateSubscribeRequest({ ...valid, firstName: marks })).toEqual({
        ok: false,
        status: 400,
        message: 'Invalid first name format',
      });
      expect(regexRun).not.toHaveBeenCalled();
    } finally {
      regexRun.mockRestore();
    }
  });

  it('trims and lowercases the email and trims the first name', () => {
    expect(validateSubscribeRequest({ email: '  Reader@Example.COM ', firstName: ' Ana ' })).toEqual({
      ok: true,
      email: 'reader@example.com',
      firstName: 'Ana',
      utmSource: undefined,
      utmCampaign: undefined,
    });
  });

  it('passes the UTM values through untouched for the payload to normalize', () => {
    const result = validateSubscribeRequest({ ...valid, utmSource: 'LinkedIn', utmCampaign: 42 });
    expect(result).toMatchObject({ ok: true, utmSource: 'LinkedIn', utmCampaign: 42 });
  });
});

describe('buildSubscriberPayload', () => {
  const base = {
    email: 'reader@example.com',
    firstName: 'ශ්\u200dරී',
    ip: '203.0.113.7',
    utmSource: 'LinkedIn',
    utmCampaign: '2026 日本 Launch',
    subscribedAt: '2026-10-18T12:00:00.000Z',
  };

  it('builds the Buttondown subscriber with the site tag and normalized last-touch metadata', () => {
    expect(buildSubscriberPayload(base)).toEqual({
      email_address: 'reader@example.com',
      ip_address: '203.0.113.7',
      tags: ['website-subscriber'],
      metadata: {
        first_name: 'ශ්\u200dරී',
        source: 'website',
        last_touch_channel: 'linkedin',
        last_touch_release: '2026-日本-launch',
        subscribed_at: '2026-10-18T12:00:00.000Z',
      },
    });
  });

  it('omits the last-touch keys entirely when no usable UTM was supplied', () => {
    const payload = buildSubscriberPayload({ ...base, utmSource: undefined, utmCampaign: '   ' });
    expect(payload.metadata).not.toHaveProperty('last_touch_channel');
    expect(payload.metadata).not.toHaveProperty('last_touch_release');
  });

  it('omits ip_address when the client IP is unknown', () => {
    expect(buildSubscriberPayload({ ...base, ip: undefined })).not.toHaveProperty('ip_address');
  });

  it('never sets a subscriber type, so Buttondown applies double opt-in', () => {
    expect(buildSubscriberPayload(base)).not.toHaveProperty('type');
  });
});

type Call = { url: string; init: RequestInit };

function fakeFetch(status: number, body: string, calls: Call[] = []) {
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init: init ?? {} });
    return new Response(body, {
      status,
      headers: { 'Content-Type': body.startsWith('<') ? 'text/html' : 'application/json' },
    });
  };
  return { fetchImpl, calls };
}

const payload = buildSubscriberPayload({
  email: 'reader@example.com',
  firstName: 'Ana',
  ip: undefined,
  utmSource: undefined,
  utmCampaign: undefined,
  subscribedAt: '2026-10-18T12:00:00.000Z',
});

describe('createButtondownSubscriber', () => {
  it('posts the payload to the documented host with a Token authorization header', async () => {
    const { fetchImpl, calls } = fakeFetch(201, '{"id":"sub_1"}');
    await createButtondownSubscriber('key-123', payload, fetchImpl);

    expect(BUTTONDOWN_SUBSCRIBERS_URL).toBe('https://api.buttondown.com/v1/subscribers');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(BUTTONDOWN_SUBSCRIBERS_URL);
    expect(calls[0].init.method).toBe('POST');
    const headers = new Headers(calls[0].init.headers);
    expect(headers.get('authorization')).toBe('Token key-123');
    expect(headers.get('content-type')).toBe('application/json');
    expect(headers.has('x-buttondown-collision-behavior')).toBe(false);
    expect(JSON.parse(String(calls[0].init.body))).toEqual(payload);
  });

  it('reports a 201 as created', async () => {
    const { fetchImpl } = fakeFetch(201, '{"id":"sub_1","type":"unactivated"}');
    await expect(createButtondownSubscriber('k', payload, fetchImpl)).resolves.toEqual({
      kind: 'created',
    });
  });

  // Buttondown's SubscriberInputValidationErrorCode enum, copied from its
  // OpenAPI schema on 2026-10-18, split by what the reply must do. A code that
  // says the address is already known gets the neutral reply, so the form
  // cannot be used to test membership. Every other code means the request
  // itself failed, and telling the visitor to check an inbox that will stay
  // empty would be a silent failure.
  const NEUTRAL_400_CODES = [
    'email_already_exists',
    'subscriber_already_exists',
    'subscriber_already_premium',
    'subscriber_suppressed',
    'subscriber_blocked',
    'email_blocked',
    'ip_address_spammy',
  ];
  const FAILED_400_CODES = [
    'currency_mismatch',
    'email_empty',
    'email_invalid',
    'invalid_input',
    'metadata_invalid',
    'newsletter_not_accepting_subscribers',
    'payment_failed',
    'promo_code_invalid',
    'rate_limited',
    'subscriber_id_invalid',
    'tag_invalid',
  ];

  it.each(NEUTRAL_400_CODES)(
    'reports a 400 %s as declined, carrying the code for the log',
    async (code) => {
      const { fetchImpl } = fakeFetch(400, JSON.stringify({ code, detail: 'x' }));
      await expect(createButtondownSubscriber('k', payload, fetchImpl)).resolves.toEqual({
        kind: 'declined',
        status: 400,
        code,
      });
    },
  );

  it.each(FAILED_400_CODES)(
    'reports a 400 %s as failed, so the visitor is not sent to an empty inbox',
    async (code) => {
      const { fetchImpl } = fakeFetch(400, JSON.stringify({ code, detail: 'x' }));
      await expect(createButtondownSubscriber('k', payload, fetchImpl)).resolves.toEqual({
        kind: 'failed',
        status: 400,
        code,
      });
    },
  );

  it('reports a 400 with a body that is not JSON as failed with no code', async () => {
    const { fetchImpl } = fakeFetch(400, '<html>Bad Request</html>');
    await expect(createButtondownSubscriber('k', payload, fetchImpl)).resolves.toEqual({
      kind: 'failed',
      status: 400,
      code: undefined,
    });
  });

  it.each([
    [401, '{"code":"authentication_invalid","detail":"x"}', 'authentication_invalid'],
    [403, '{"code":"feature_disabled","detail":"x"}', 'feature_disabled'],
    [422, '{"detail":[{"loc":["metadata"],"msg":"x"}]}', undefined],
    [429, '', undefined],
    [502, '<html><body>Bad Gateway</body></html>', undefined],
  ])('reports a %s as failed without throwing on the body', async (status, body, code) => {
    const { fetchImpl } = fakeFetch(status, body);
    await expect(createButtondownSubscriber('k', payload, fetchImpl)).resolves.toEqual({
      kind: 'failed',
      status,
      code,
    });
  });

  it('treats a code that is not a string as unknown, so the reply is a failure', async () => {
    const { fetchImpl } = fakeFetch(400, '{"code":{"nested":true}}');
    await expect(createButtondownSubscriber('k', payload, fetchImpl)).resolves.toEqual({
      kind: 'failed',
      status: 400,
      code: undefined,
    });
  });

  it('lets a network failure propagate to the route', async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new TypeError('fetch failed');
    };
    await expect(createButtondownSubscriber('k', payload, fetchImpl)).rejects.toThrow('fetch failed');
  });
});

describe('responseFor', () => {
  async function snapshot(response: Response) {
    return {
      status: response.status,
      contentType: response.headers.get('content-type'),
      body: await response.text(),
    };
  }

  it('answers a created and a declined subscriber identically', async () => {
    const created = await snapshot(responseFor({ kind: 'created' }));
    const declined = await snapshot(
      responseFor({ kind: 'declined', status: 400, code: 'email_already_exists' }),
    );
    expect(created).toEqual(declined);
    expect(created).toEqual({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Check your email to confirm your subscription!' }),
    });
  });

  it('answers a failure with a generic error that names nothing upstream', async () => {
    const failed = await snapshot(responseFor({ kind: 'failed', status: 502, code: undefined }));
    expect(failed).toEqual({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Unable to process subscription at this time' }),
    });
  });
});

describe('readJsonBody', () => {
  it('parses a JSON object', () => {
    expect(readJsonBody('{"email":"a@b.io"}')).toEqual({ ok: true, data: { email: 'a@b.io' } });
  });

  it('parses JSON null without throwing, leaving the validator to reject it', () => {
    expect(readJsonBody('null')).toEqual({ ok: true, data: null });
  });

  it.each([
    ['a form-encoded body', 'email=a%40b.io&firstName=Ana'],
    ['an empty body', ''],
    ['truncated JSON', '{"email":'],
  ])('rejects %s without echoing it', (_label, body) => {
    expect(readJsonBody(body)).toEqual({ ok: false });
  });
});
