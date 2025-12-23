import type { APIRoute } from 'astro';

// Enable server-side rendering for this endpoint
export const prerender = false;

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 60; // 1 hour in seconds
const MAX_REQUESTS_PER_WINDOW = 5;

const UPSTASH_REDIS_REST_URL = import.meta.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Name validation regex (supports international characters)
const NAME_REGEX = /^[\p{L}\s\-']{2,150}$/u;

async function checkRateLimit(key: string): Promise<{ allowed: boolean; message?: string }> {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    // Fallback: allow all if Redis is not configured
    return { allowed: true };
  }
  const res = await fetch(`${UPSTASH_REDIS_REST_URL}/incr/${key}`, {
    headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
  });
  const data = await res.json();
  const count = data.result || 0;
  if (count === 1) {
    // Set expiry on first request
    await fetch(`${UPSTASH_REDIS_REST_URL}/expire/${key}/${RATE_LIMIT_WINDOW}`, {
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
    });
  }
  if (count > MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, message: 'Too many requests. Please try again later.' };
  }
  return { allowed: true };
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
    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';

    // Check IP-based rate limit
    const ipRateLimitCheck = await checkRateLimit(`rate_limit:${ip}`);
    if (!ipRateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ message: ipRateLimitCheck.message }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '3600'
          }
        }
      );
    }

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

    // Check email-based rate limit
    const emailRateLimitCheck = await checkRateLimit(`rate_limit_email:${data.email.toLowerCase()}`);
    if (!emailRateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ message: 'This email has been submitted recently. Please check your inbox.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '3600'
          }
        }
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
          subscribed_at: new Date().toISOString()
        }
      }),
    });

    const responseData = await response.json();

    if (response.status >= 400) {
      // Log error for debugging (without exposing user data)
      console.error('Buttondown API error:', {
        status: response.status,
        response: responseData
      });

      // Handle specific ButtonDown errors
      if (response.status === 400 && responseData?.email_address) {
        // Email already subscribed or invalid
        return new Response(
          JSON.stringify({ message: responseData.email_address[0] || 'Unable to process subscription' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

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