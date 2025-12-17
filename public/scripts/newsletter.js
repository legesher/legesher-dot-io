const form = document.getElementById('newsletter-form');
const messageElement = document.getElementById('form-message');

if (form && messageElement) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const target = e.target;
    if (!(target instanceof HTMLFormElement)) return;

    // Get the submit button
    const submitButton = target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton?.textContent || 'Subscribe';

    // Prevent double submissions
    if (submitButton?.disabled) return;

    const formData = new FormData(target);
    const email = formData.get('email');
    const firstName = formData.get('firstName');
    const website = formData.get('website'); // Honeypot field

    try {
      // Show loading state immediately
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Subscribing...';
      }
      messageElement.textContent = 'Processing your subscription...';
      messageElement.className = 'text-sm text-blue-600 mt-4';

      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName,
          website
        }),
      });

      const data = await response.json();

      if (response.ok) {
        messageElement.textContent = data.message || 'Check your email to confirm your subscription!';
        messageElement.className = 'text-sm text-green-600 mt-4';
        target.reset();
        // Keep button disabled on success (they've already subscribed)
        if (submitButton) {
          submitButton.textContent = 'Subscribed!';
        }
      } else {
        const errorMessage = data.message || data.detail || 'Failed to subscribe. Please try again.';
        messageElement.textContent = errorMessage;
        messageElement.className = 'text-sm text-red-600 mt-4';
        // Re-enable button on error so they can retry
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      }
    } catch (error) {
      messageElement.textContent = 'An error occurred. Please try again.';
      messageElement.className = 'text-sm text-red-600 mt-4';
      // Re-enable button on error
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
}
