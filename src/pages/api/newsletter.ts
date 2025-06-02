import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const BUTTONDOWN_API_KEY = import.meta.env.BUTTONDOWN_API_KEY;
  const BUTTONDOWN_URL = import.meta.env.BUTTONDOWN_URL;

  if (!BUTTONDOWN_API_KEY || !BUTTONDOWN_URL) {
    return new Response(JSON.stringify({
      error: 'Newsletter configuration is missing'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const data = await request.formData();
    const email = data.get('email');

    if (!email) {
      return new Response(JSON.stringify({
        error: 'Email is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const response = await fetch(BUTTONDOWN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Token ${BUTTONDOWN_API_KEY}`
      },
      body: new URLSearchParams({
        email: email.toString()
      })
    });

    if (!response.ok) {
      throw new Error('Subscription failed');
    }

    return new Response(JSON.stringify({
      message: 'Successfully subscribed!'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to subscribe'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 