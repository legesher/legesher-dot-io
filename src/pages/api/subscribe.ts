import type { APIRoute } from 'astro';

// Enable server-side rendering for this endpoint
export const prerender = false;

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REQUESTS_PER_WINDOW = 5; // Maximum requests per hour per IP
const ipRequestCounts = new Map<string, { count: number; timestamp: number }>();

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Name validation regex (supports international characters)
const NAME_REGEX = /^[\p{L}\s\-']{2,50}$/u;

// Rate limiting middleware
function checkRateLimit(ip: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const userRequests = ipRequestCounts.get(ip);

  if (!userRequests) {
    ipRequestCounts.set(ip, { count: 1, timestamp: now });
    return { allowed: true };
  }

  // Reset counter if window has passed
  if (now - userRequests.timestamp > RATE_LIMIT_WINDOW) {
    ipRequestCounts.set(ip, { count: 1, timestamp: now });
    return { allowed: true };
  }

  // Check if user has exceeded rate limit
  if (userRequests.count >= MAX_REQUESTS_PER_WINDOW) {
    return { 
      allowed: false, 
      message: 'Too many requests. Please try again later.' 
    };
  }

  // Increment counter
  userRequests.count++;
  return { allowed: true };
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequestCounts.entries()) {
    if (now - data.timestamp > RATE_LIMIT_WINDOW) {
      ipRequestCounts.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);

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
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    const rateLimitCheck = checkRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ message: rateLimitCheck.message }),
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
    
    // Basic validation before making API call
    if (!data.email?.trim() || !data.firstName?.trim()) {
      return new Response(
        JSON.stringify({ message: 'Email and first name are required' }),
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
        first_name: data.firstName.trim(),
        tags: ['website-subscriber'],
        status: 'active',
        metadata: {
          source: 'website',
          subscribed_at: new Date().toISOString()
        }
      }),
    });

    const responseData = await response.json();

    if (response.status >= 400) {
      // Log error for debugging
      console.error('Buttondown API error:', {
        status: response.status,
        error: responseData
      });
      
      return new Response(
        JSON.stringify({ message: 'Unable to process subscription at this time' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Successfully subscribed to the newsletter!' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Subscription error:', error);
    return new Response(
      JSON.stringify({ message: 'Unable to process subscription at this time' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 