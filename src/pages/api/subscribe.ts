import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const BUTTONDOWN_API_KEY = import.meta.env.BUTTONDOWN_API_KEY;

  if (!BUTTONDOWN_API_KEY) {
    return new Response(
      JSON.stringify({
        message: 'Buttondown API key is not configured',
      }),
      { status: 500 }
    );
  }

  try {
    const data = await request.json();
    const email = data.email;

    if (!email) {
      return new Response(
        JSON.stringify({
          message: 'Email is required',
        }),
        { status: 400 }
      );
    }

    const response = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${BUTTONDOWN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const responseData = await response.json();

    if (response.status >= 400) {
      return new Response(
        JSON.stringify({
          message: responseData.detail || 'Error subscribing to the newsletter',
        }),
        { status: response.status }
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Successfully subscribed to the newsletter!',
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return new Response(
      JSON.stringify({
        message: 'Error subscribing to the newsletter',
      }),
      { status: 500 }
    );
  }
}; 