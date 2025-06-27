const form = document.getElementById('newsletter-form');
const messageElement = document.getElementById('form-message');

if (form && messageElement) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const target = e.target;
    if (!(target instanceof HTMLFormElement)) return;
    const formData = new FormData(target);
    const email = formData.get('email');
    const firstName = formData.get('firstName');

    try {
      console.log('Submitting form data:', { email, firstName });
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, firstName }),
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        messageElement.textContent = data.message || 'Successfully subscribed!';
        messageElement.className = 'text-sm text-green-600 mt-4';
        target.reset();
      } else {
        const errorMessage = data.message || data.detail || 'Failed to subscribe. Please try again.';
        messageElement.textContent = errorMessage;
        messageElement.className = 'text-sm text-red-600 mt-4';
      }
    } catch (error) {
      console.error('Subscription error:', error);
      messageElement.textContent = 'An error occurred. Please try again.';
      messageElement.className = 'text-sm text-red-600 mt-4';
    }
  });
}