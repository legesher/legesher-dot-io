import type { APIRoute } from 'astro';

// Enable server-side rendering for this endpoint
export const prerender = false;

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 60; // 1 hour in seconds
const MAX_REQUESTS_PER_WINDOW = 5;

// Language validation
const MAX_LANGUAGES_SELECTED = 20;
const ALLOWED_LANGUAGES = [
  'Spanish', 'Mandarin', 'Hindi', 'Portuguese', 'Arabic', 'Bengali',
  'Russian', 'Japanese', 'French', 'German', 'Korean', 'Vietnamese',
  'Turkish', 'Italian', 'Polish'
];

const UPSTASH_REDIS_REST_URL = import.meta.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Name validation regex (supports international characters)
const NAME_REGEX = /^[\p{L}\s\-']{2,50}$/u;

// Sanitize text input to prevent XSS
function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')  // Remove HTML tags
    .replace(/[<>'"]/g, '')    // Remove additional XSS vectors
    .trim()
    .slice(0, 200);            // Limit length
}

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

    // Validate languages array if provided
    if (data.languages !== undefined) {
      if (!Array.isArray(data.languages)) {
        return new Response(
          JSON.stringify({ message: 'Invalid languages format' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Prevent DoS via huge arrays
      if (data.languages.length > MAX_LANGUAGES_SELECTED) {
        return new Response(
          JSON.stringify({ message: 'Too many languages selected' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Ensure all entries are strings
      if (!data.languages.every((lang: unknown) => typeof lang === 'string')) {
        return new Response(
          JSON.stringify({ message: 'Invalid language data' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Validate all selected languages are in allowed list
      const invalidLangs = data.languages.filter((lang: string) => !ALLOWED_LANGUAGES.includes(lang));
      if (invalidLangs.length > 0) {
        return new Response(
          JSON.stringify({ message: 'Invalid language selection' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate languagesOther is a string (if provided)
    if (data.languagesOther !== undefined && typeof data.languagesOther !== 'string') {
      return new Response(
        JSON.stringify({ message: 'Invalid other languages format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize "other languages" free text
    let languagesOther = undefined;
    if (data.languagesOther && typeof data.languagesOther === 'string') {
      languagesOther = sanitizeText(data.languagesOther);
      if (languagesOther.length === 0) languagesOther = undefined;
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
        first_name: data.firstName.trim(),
        ip_address: ip !== 'unknown' ? ip : undefined,
        tags: ['website-subscriber'],
        // Removed 'status: active' to enable double opt-in
        metadata: {
          source: 'website',
          subscribed_at: new Date().toISOString(),
          languages: data.languages || [],
          languages_other: languagesOther
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